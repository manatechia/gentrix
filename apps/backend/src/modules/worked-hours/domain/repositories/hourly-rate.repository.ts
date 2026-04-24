import type { EntityId, MembershipHourlyRate } from '@gentrix/shared-types';

export interface HourlyRateCreateRecord {
  membershipId: EntityId;
  rate: string;
  currency: string;
  effectiveFrom: Date;
  actor: string;
}

export interface HourlyRateUpdateRecord {
  rate?: string;
  currency?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date | null;
  actor: string;
}

export interface HourlyRateRepository {
  listByMembership(membershipId: EntityId): Promise<MembershipHourlyRate[]>;
  findById(id: EntityId): Promise<MembershipHourlyRate | null>;
  /// Devuelve la tarifa aplicable a `workDate` para la membresía (vigente
  /// en esa fecha). `null` si no hay ninguna.
  findApplicable(
    membershipId: EntityId,
    workDate: Date,
  ): Promise<MembershipHourlyRate | null>;
  create(input: HourlyRateCreateRecord): Promise<MembershipHourlyRate>;
  closePrevious(
    membershipId: EntityId,
    beforeDate: Date,
    actor: string,
  ): Promise<void>;
  update(id: EntityId, input: HourlyRateUpdateRecord): Promise<MembershipHourlyRate>;
}

export const HOURLY_RATE_REPOSITORY = Symbol('HOURLY_RATE_REPOSITORY');
