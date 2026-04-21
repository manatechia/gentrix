import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import type {
  PasswordResetResponse,
  UserCreateInput,
  UserOverview,
} from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import {
  hashPassword,
  verifyPassword,
} from '../../../common/auth/password-hash';
import {
  assertPasswordPolicy,
  generateTemporaryPassword,
  validatePasswordPolicy,
} from '../../../common/auth/password-policy';
import {
  PASSWORD_RESET_AUDIT_REPOSITORY,
  type PasswordResetAuditRepository,
} from '../domain/repositories/password-reset-audit.repository';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../domain/repositories/user.repository';

interface AdminActor {
  userId: string;
  label: string;
  organizationId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface SelfActor {
  userId: string;
  label: string;
  organizationId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    @Inject(PASSWORD_RESET_AUDIT_REPOSITORY)
    private readonly audits: PasswordResetAuditRepository,
    @InjectPinoLogger(UsersService.name)
    private readonly logger: PinoLogger,
  ) {}

  async getUsers(organizationId: string): Promise<UserOverview[]> {
    return this.users.list(organizationId);
  }

  async createUser(
    input: UserCreateInput,
    actor: string,
    organizationId: string,
  ): Promise<UserOverview> {
    const fullName = input.fullName.trim();
    const password = input.password.trim();
    const email = input.email.trim().toLowerCase();

    if (!fullName) {
      throw new BadRequestException('El nombre completo es obligatorio.');
    }

    if (!password) {
      throw new BadRequestException('La contraseña es obligatoria.');
    }

    // When an admin seeds a password manually we still enforce the policy.
    // The user will be forced to change it on their first login anyway.
    assertPolicyAsHttp(password);

    const passwordHash = await hashPassword(password);

    try {
      const created = await this.users.create({
        ...input,
        fullName,
        password: passwordHash,
        email,
        actor,
        organizationId,
      });
      this.logger.info(
        {
          targetUserId: created.id,
          email: created.email,
          role: created.role,
          organizationId,
          actor,
        },
        'users.created',
      );
      return created;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un usuario con ese email.');
      }

      throw error;
    }
  }

  async resetPassword(
    targetUserId: string,
    admin: AdminActor,
  ): Promise<PasswordResetResponse> {
    if (admin.userId === targetUserId) {
      throw new BadRequestException(
        'No podés reiniciar tu propia contraseña desde el panel de administración.',
      );
    }

    const target = await this.users.findById(
      targetUserId,
      admin.organizationId,
    );

    if (!target) {
      throw new NotFoundException('El usuario no existe en esta organización.');
    }

    if (target.role === 'admin') {
      throw new BadRequestException(
        'No está permitido reiniciar la contraseña de otro administrador desde este panel.',
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const temporaryHash = await hashPassword(temporaryPassword);

    await this.users.resetPassword({
      userId: targetUserId,
      organizationId: admin.organizationId,
      newPassword: temporaryHash,
      actor: admin.label,
    });

    const occurredAt = new Date();
    await this.audits.record({
      organizationId: admin.organizationId,
      adminUserId: admin.userId,
      targetUserId,
      action: 'admin-reset',
      result: 'success',
      occurredAt,
      ipAddress: admin.ipAddress,
      userAgent: admin.userAgent,
    });

    this.logger.info(
      {
        adminUserId: admin.userId,
        targetUserId,
        organizationId: admin.organizationId,
      },
      'users.password.reset-by-admin',
    );

    return {
      userId: targetUserId as PasswordResetResponse['userId'],
      temporaryPassword,
      forcePasswordChange: true,
      resetAt: toIsoDateString(occurredAt),
    };
  }

  async completeForcedChange(
    actor: SelfActor,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    if (newPassword !== confirmPassword) {
      await this.recordForcedFailure(actor, 'confirmation-mismatch');
      throw new BadRequestException(
        'La confirmación no coincide con la nueva contraseña.',
      );
    }

    const violations = validatePasswordPolicy(newPassword);
    if (violations.length > 0) {
      await this.recordForcedFailure(actor, 'policy-violation');
      throw new BadRequestException(violations.map((v) => v.message).join(' '));
    }

    const record = await this.users.findPasswordRecord(actor.userId);

    if (!record) {
      throw new NotFoundException('No pude encontrar tu cuenta.');
    }

    const currentVerification = await verifyPassword(
      currentPassword,
      record.password,
    );

    if (!currentVerification.matches) {
      await this.recordForcedFailure(actor, 'invalid-current-password');
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }

    // Compare against the stored hash (or legacy plaintext) so the rule
    // holds regardless of the current storage format.
    const newMatchesCurrent = await verifyPassword(newPassword, record.password);
    if (newMatchesCurrent.matches) {
      await this.recordForcedFailure(actor, 'same-as-current');
      throw new BadRequestException(
        'La nueva contraseña no puede ser igual a la actual.',
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    await this.users.completeForcedChange({
      userId: actor.userId,
      newPassword: newPasswordHash,
      actor: actor.label,
    });

    await this.audits.record({
      organizationId: record.organizationId,
      adminUserId: null,
      targetUserId: actor.userId,
      action: 'forced-change-completed',
      result: 'success',
      occurredAt: new Date(),
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    this.logger.info(
      { userId: actor.userId, organizationId: record.organizationId },
      'users.password.forced-change-completed',
    );
  }

  private async recordForcedFailure(
    actor: SelfActor,
    reason: string,
  ): Promise<void> {
    this.logger.warn(
      { userId: actor.userId, organizationId: actor.organizationId, reason },
      'users.password.forced-change-failed',
    );
    await this.audits.record({
      organizationId: actor.organizationId,
      adminUserId: null,
      targetUserId: actor.userId,
      action: 'forced-change-failed',
      result: 'failure',
      reason,
      occurredAt: new Date(),
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }
}

function assertPolicyAsHttp(password: string): void {
  try {
    assertPasswordPolicy(password);
  } catch (error) {
    throw new BadRequestException((error as Error).message);
  }
}
