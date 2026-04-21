import { randomUUID } from 'node:crypto';

import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import type {
  AuthLoginResponse,
  AuthSession,
  LogoutResponse,
} from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

import {
  hashPassword,
  verifyPassword,
} from '../../../common/auth/password-hash';

import type { LoginDto } from '../presentation/dto/login.dto';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepository,
  type AuthSessionWithToken,
} from '../domain/repositories/auth-session.repository';
import {
  AUTH_USER_REPOSITORY,
  type AuthUserRepository,
} from '../domain/repositories/auth-user.repository';

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly users: AuthUserRepository,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  async login(credentials: LoginDto): Promise<AuthLoginResponse> {
    const user = await this.users.findByEmail(credentials.email);

    if (!user) {
      this.logger.warn({ email: credentials.email, reason: 'user-not-found' }, 'auth.login.failed');
      throw new UnauthorizedException('Invalid email or password.');
    }

    const verification = await verifyPassword(
      credentials.password,
      user.password,
    );

    if (!verification.matches) {
      this.logger.warn(
        { email: credentials.email, userId: user.id, reason: 'bad-password' },
        'auth.login.failed',
      );
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (verification.needsRehash) {
      // The stored row is still in legacy plaintext form. Migrate it now so
      // subsequent logins use the hashed path. Failures here must not block
      // login — worst case we'll migrate on the next login.
      try {
        const rehashed = await hashPassword(credentials.password);
        await this.users.updatePasswordHash(user.id, rehashed);
      } catch (error) {
        this.logger.warn({ err: error, userId: user.id }, 'auth.password.rehash-failed');
      }
    }

    const session: AuthSessionWithToken = {
      token: randomUUID(),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange,
      },
      activeOrganization: user.activeOrganization,
      activeFacility: user.activeFacility,
      expiresAt: toIsoDateString(new Date(Date.now() + SESSION_TTL_MS)),
    };

    await this.sessions.create(session);
    this.logger.info(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.activeOrganization?.id,
        forcePasswordChange: user.forcePasswordChange,
      },
      'auth.login.ok',
    );
    return session;
  }

  async getSession(token: string): Promise<AuthSession> {
    const session = await this.validateSessionToken(token);

    if (!session) {
      throw new UnauthorizedException('Unauthorized.');
    }

    return {
      user: session.user,
      activeOrganization: session.activeOrganization,
      activeFacility: session.activeFacility,
      expiresAt: session.expiresAt,
    };
  }

  async validateSessionToken(
    token: string,
  ): Promise<AuthSessionWithToken | null> {
    return this.sessions.findValidByToken(token);
  }

  async logout(token: string, actor: string): Promise<LogoutResponse> {
    const deleted = await this.sessions.delete(token, actor);

    if (!deleted) {
      throw new UnauthorizedException('Unauthorized.');
    }

    this.logger.info({ actor }, 'auth.logout');
    return { success: true };
  }
}
