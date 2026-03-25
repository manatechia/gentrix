import type {
  AuthFacility,
  AuthOrganization,
  AuthUser,
} from '@gentrix/shared-types';

export interface StoredAuthUser extends AuthUser {
  password: string;
  activeOrganization: AuthOrganization;
  activeFacility?: AuthFacility;
}

export interface AuthUserRepository {
  findByEmail(email: string): Promise<StoredAuthUser | null>;
}

export const AUTH_USER_REPOSITORY = Symbol('AUTH_USER_REPOSITORY');
