import type { AuthSession, AuthUser } from '@gentrix/shared-types';

export interface AuthSessionWithToken extends AuthSession {
  token: string;
}

export interface StoredSession extends AuthSessionWithToken {
  user: AuthUser;
}

export interface AuthSessionRepository {
  create(session: AuthSessionWithToken): Promise<void>;
  findValidByToken(token: string): Promise<AuthSessionWithToken | null>;
  delete(token: string, actor: string): Promise<boolean>;
}

export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');
