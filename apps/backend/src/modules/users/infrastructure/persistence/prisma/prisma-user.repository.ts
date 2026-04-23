import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AuthRole,
  EntityStatus,
  IsoDateString,
  ShiftWindow,
  TeamMemberOverview,
  UserOverview,
} from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type {
  CompleteForcedChangeInput,
  PersistedUserCreateInput,
  ResetPasswordInput,
  UserPasswordRecord,
  UserRepository,
} from '../../../domain/repositories/user.repository';

type MembershipRecord = Prisma.OrganizationMembershipGetPayload<{
  include: {
    user: true;
    role: true;
  };
}>;

type TeamMembershipRecord = Prisma.OrganizationMembershipGetPayload<{
  include: {
    user: true;
    role: true;
    jobTitle: true;
    ward: true;
  };
}>;

const authRoles = new Set<AuthRole>([
  'admin',
  'nurse',
  'assistant',
  'health-director',
  'external',
]);

const shiftWindows = new Set<ShiftWindow>([
  'morning',
  'afternoon',
  'night',
]);

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async list(organizationId: string): Promise<UserOverview[]> {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: {
        organizationId,
        deletedAt: null,
        role: {
          code: { not: 'admin' },
        },
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
        role: true,
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    return memberships.map(mapMembershipRecord);
  }

  async listTeam(organizationId: string): Promise<TeamMemberOverview[]> {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'active',
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
        role: true,
        jobTitle: true,
        ward: true,
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    return memberships.map(mapTeamMembershipRecord);
  }

  async findById(
    userId: string,
    organizationId: string,
  ): Promise<UserOverview | null> {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        userId,
        organizationId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      include: {
        user: true,
        role: true,
      },
    });

    return membership ? mapMembershipRecord(membership) : null;
  }

  async findMembershipIdByUser(
    userId: string,
    organizationId: string,
  ): Promise<string | null> {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        userId,
        organizationId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      select: { id: true },
    });

    return membership?.id ?? null;
  }

  async findPasswordRecord(
    userId: string,
  ): Promise<UserPasswordRecord | null> {
    const user = await this.prisma.userAccount.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        memberships: {
          where: { deletedAt: null, status: 'active' },
          orderBy: [{ isDefault: 'desc' }, { joinedAt: 'asc' }],
          take: 1,
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return null;
    }

    return {
      id: user.id,
      organizationId: user.memberships[0]!.organizationId,
      password: user.password,
      forcePasswordChange: user.forcePasswordChange,
      passwordChangedAt: user.passwordChangedAt
        ? toIsoDateString(user.passwordChangedAt)
        : null,
    };
  }

  async create(input: PersistedUserCreateInput): Promise<UserOverview> {
    const existingUser = await this.prisma.userAccount.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email.');
    }

    const role = await this.prisma.role.findUnique({
      where: {
        organizationId_code: {
          organizationId: input.organizationId,
          code: input.role,
        },
      },
    });

    if (!role) {
      throw new NotFoundException(
        'El rol solicitado no está configurado en esta organización.',
      );
    }

    const now = new Date();
    const createdUser = await this.prisma.userAccount.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        password: input.password,
        status: 'active',
        // Every new user is forced to pick their own password on first login.
        forcePasswordChange: true,
        passwordChangedAt: null,
        createdAt: now,
        createdBy: input.actor,
        updatedAt: now,
        updatedBy: input.actor,
        memberships: {
          create: {
            organizationId: input.organizationId,
            roleId: role.id,
            status: 'active',
            isDefault: true,
            joinedAt: now,
            createdAt: now,
            createdBy: input.actor,
            updatedAt: now,
            updatedBy: input.actor,
          },
        },
      },
      include: {
        memberships: {
          where: {
            organizationId: input.organizationId,
            deletedAt: null,
          },
          include: {
            user: true,
            role: true,
          },
          take: 1,
        },
      },
    });

    return mapMembershipRecord(createdUser.memberships[0]);
  }

  async resetPassword(input: ResetPasswordInput): Promise<UserOverview> {
    // Keep the reset scoped to the admin's own organization — a user with no
    // active membership in that org should not be resettable from here.
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        userId: input.userId,
        organizationId: input.organizationId,
        deletedAt: null,
        user: { deletedAt: null },
      },
    });

    if (!membership) {
      throw new NotFoundException('El usuario no existe en esta organización.');
    }

    const now = new Date();
    await this.prisma.userAccount.update({
      where: { id: input.userId },
      data: {
        password: input.newPassword,
        forcePasswordChange: true,
        // The timestamp is intentionally cleared so the forced-change screen
        // cannot mistake an admin-reset password for a user-chosen one.
        passwordChangedAt: null,
        updatedAt: now,
        updatedBy: input.actor,
      },
    });

    const refreshed = await this.findById(input.userId, input.organizationId);

    if (!refreshed) {
      throw new NotFoundException('No pude recuperar el usuario tras el reset.');
    }

    return refreshed;
  }

  async completeForcedChange(input: CompleteForcedChangeInput): Promise<void> {
    const now = new Date();
    await this.prisma.userAccount.update({
      where: { id: input.userId },
      data: {
        password: input.newPassword,
        forcePasswordChange: false,
        passwordChangedAt: now,
        updatedAt: now,
        updatedBy: input.actor,
      },
    });
  }
}

function mapMembershipRecord(record: MembershipRecord): UserOverview {
  return {
    id: record.user.id as UserOverview['id'],
    fullName: record.user.fullName,
    email: record.user.email,
    role: normalizeAuthRole(record.role.code),
    status: normalizeEntityStatus(record.user.status),
    forcePasswordChange: record.user.forcePasswordChange,
    passwordChangedAt: record.user.passwordChangedAt
      ? (toIsoDateString(record.user.passwordChangedAt) as IsoDateString)
      : null,
  };
}

function mapTeamMembershipRecord(
  record: TeamMembershipRecord,
): TeamMemberOverview {
  return {
    id: record.user.id as TeamMemberOverview['id'],
    fullName: record.user.fullName,
    email: record.user.email,
    role: normalizeAuthRole(record.role.code),
    jobTitleCode: record.jobTitle?.code ?? null,
    jobTitleLabel: record.jobTitle?.displayName ?? null,
    wardName: record.ward?.name ?? null,
    shift: normalizeShiftWindow(record.shift),
    status: normalizeEntityStatus(record.user.status),
  };
}

function normalizeAuthRole(value: string): AuthRole {
  return authRoles.has(value as AuthRole) ? (value as AuthRole) : 'assistant';
}

function normalizeShiftWindow(value: string | null): ShiftWindow | null {
  if (!value) {
    return null;
  }
  return shiftWindows.has(value as ShiftWindow)
    ? (value as ShiftWindow)
    : null;
}

function normalizeEntityStatus(value: string): EntityStatus {
  return value === 'inactive' || value === 'archived' ? value : 'active';
}
