import type {
  EntityId,
  UserSchedule,
  UserScheduleCreateInput,
  UserScheduleUpdateInput,
} from '@gentrix/shared-types';

export interface ScheduleRepository {
  listByMembershipId(membershipId: EntityId): Promise<UserSchedule[]>;
  findById(scheduleId: EntityId): Promise<UserSchedule | null>;
  create(
    membershipId: EntityId,
    userId: EntityId,
    input: UserScheduleCreateInput,
    actor: string,
  ): Promise<UserSchedule>;
  update(
    scheduleId: EntityId,
    userId: EntityId,
    input: UserScheduleUpdateInput,
    actor: string,
  ): Promise<UserSchedule>;
}

export const SCHEDULE_REPOSITORY = Symbol('SCHEDULE_REPOSITORY');
