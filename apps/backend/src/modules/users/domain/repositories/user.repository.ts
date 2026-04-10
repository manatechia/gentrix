import type { UserCreateInput, UserOverview } from '@gentrix/shared-types';

export interface PersistedUserCreateInput extends UserCreateInput {
  organizationId: string;
  actor: string;
}

export interface UserRepository {
  list(organizationId: string): Promise<UserOverview[]>;
  create(input: PersistedUserCreateInput): Promise<UserOverview>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
