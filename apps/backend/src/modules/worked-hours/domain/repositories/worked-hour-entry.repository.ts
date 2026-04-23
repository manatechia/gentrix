import type { EntityId, WorkedHourEntry } from '@gentrix/shared-types';

export interface WorkedHourEntryCreateRecord {
  membershipId: EntityId;
  workDate: Date;
  hours: string;
  notes?: string | null;
  actor: string;
}

export interface WorkedHourEntryUpdateRecord {
  workDate?: Date;
  hours?: string;
  notes?: string | null;
  actor: string;
}

export interface WorkedHourEntryRepository {
  listByMembership(
    membershipId: EntityId,
    options?: {
      from?: Date;
      to?: Date;
      settled?: boolean;
    },
  ): Promise<WorkedHourEntry[]>;
  findById(id: EntityId): Promise<WorkedHourEntry | null>;
  create(input: WorkedHourEntryCreateRecord): Promise<WorkedHourEntry>;
  update(id: EntityId, input: WorkedHourEntryUpdateRecord): Promise<WorkedHourEntry>;
  softDelete(id: EntityId, actor: string): Promise<void>;
}

export const WORKED_HOUR_ENTRY_REPOSITORY = Symbol('WORKED_HOUR_ENTRY_REPOSITORY');
