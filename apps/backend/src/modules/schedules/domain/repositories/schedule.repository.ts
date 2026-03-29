import type {
  EntityId,
  StaffSchedule,
  StaffScheduleCreateInput,
  StaffScheduleUpdateInput,
} from '@gentrix/shared-types';

export interface ScheduleRepository {
  listByStaffId(staffId: EntityId): Promise<StaffSchedule[]>;
  findById(scheduleId: EntityId): Promise<StaffSchedule | null>;
  create(
    staffId: EntityId,
    input: StaffScheduleCreateInput,
    actor: string,
  ): Promise<StaffSchedule>;
  update(
    scheduleId: EntityId,
    input: StaffScheduleUpdateInput,
    actor: string,
  ): Promise<StaffSchedule>;
}

export const SCHEDULE_REPOSITORY = Symbol('SCHEDULE_REPOSITORY');
