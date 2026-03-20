import type { AuthUser } from '@gentrix/shared-types';

export interface StoredAuthUser extends AuthUser {
  password: string;
}

export interface AuthUserRepository {
  findByEmail(email: string): Promise<StoredAuthUser | null>;
}

export const AUTH_USER_REPOSITORY = Symbol('AUTH_USER_REPOSITORY');
