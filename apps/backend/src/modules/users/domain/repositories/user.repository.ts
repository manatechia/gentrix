import type {
  IsoDateString,
  TeamMemberOverview,
  UserCreateInput,
  UserOverview,
} from '@gentrix/shared-types';

export interface PersistedUserCreateInput extends UserCreateInput {
  organizationId: string;
  actor: string;
}

export interface ResetPasswordInput {
  userId: string;
  organizationId: string;
  newPassword: string;
  actor: string;
}

export interface CompleteForcedChangeInput {
  userId: string;
  newPassword: string;
  actor: string;
}

export interface UserPasswordRecord {
  id: string;
  organizationId: string;
  password: string;
  forcePasswordChange: boolean;
  passwordChangedAt: IsoDateString | null;
}

export interface UserRepository {
  list(organizationId: string): Promise<UserOverview[]>;
  listTeam(organizationId: string): Promise<TeamMemberOverview[]>;
  findById(
    userId: string,
    organizationId: string,
  ): Promise<UserOverview | null>;
  findMembershipIdByUser(
    userId: string,
    organizationId: string,
  ): Promise<string | null>;
  findPasswordRecord(userId: string): Promise<UserPasswordRecord | null>;
  create(input: PersistedUserCreateInput): Promise<UserOverview>;
  resetPassword(input: ResetPasswordInput): Promise<UserOverview>;
  completeForcedChange(input: CompleteForcedChangeInput): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
