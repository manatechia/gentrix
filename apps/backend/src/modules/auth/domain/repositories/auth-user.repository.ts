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

// Re-export AuthUser.forcePasswordChange so future consumers don't forget it
// lives on the shared contract.
export type { AuthUser };

export interface AuthUserRepository {
  findByEmail(email: string): Promise<StoredAuthUser | null>;
  /**
   * Replace the stored password hash without touching any other field.
   * Used to lazily migrate rows that were still in legacy plaintext form on
   * first successful login after the hashing rollout.
   */
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}

export const AUTH_USER_REPOSITORY = Symbol('AUTH_USER_REPOSITORY');
