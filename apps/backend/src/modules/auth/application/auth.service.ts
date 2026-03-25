import { randomUUID } from 'node:crypto';

import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type {
  AuthLoginResponse,
  AuthSession,
  LogoutResponse,
} from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

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
  ) {}

  async login(credentials: LoginDto): Promise<AuthLoginResponse> {
    const user = await this.users.findByEmail(credentials.email);

    if (!user || user.password !== credentials.password) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const session: AuthSessionWithToken = {
      token: randomUUID(),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      activeOrganization: user.activeOrganization,
      activeFacility: user.activeFacility,
      expiresAt: toIsoDateString(new Date(Date.now() + SESSION_TTL_MS)),
    };

    await this.sessions.create(session);
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

    return { success: true };
  }
}
