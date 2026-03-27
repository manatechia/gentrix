import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  EntityId,
  StaffSchedule,
  StaffScheduleCreateInput,
  StaffScheduleUpdateInput,
} from '@gentrix/shared-types';
import { createRandomEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { ScheduleRepository } from '../../../domain/repositories/schedule.repository';

type StaffScheduleRecord = Prisma.StaffScheduleGetPayload<Record<string, never>>;

@Injectable()
export class PrismaScheduleRepository implements ScheduleRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async listByStaffId(staffId: EntityId): Promise<StaffSchedule[]> {
    const schedules = await this.prisma.staffSchedule.findMany({
      where: {
        staffId,
        deletedAt: null,
      },
      orderBy: [
        { exceptionDate: 'asc' },
        { weekday: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return schedules.map(mapScheduleRecord);
  }

  async findById(scheduleId: EntityId): Promise<StaffSchedule | null> {
    const schedule = await this.prisma.staffSchedule.findFirst({
      where: {
        id: scheduleId,
        deletedAt: null,
      },
    });

    return schedule ? mapScheduleRecord(schedule) : null;
  }

  async create(
    staffId: EntityId,
    input: StaffScheduleCreateInput,
    actor: string,
  ): Promise<StaffSchedule> {
    const now = new Date();
    const created = await this.prisma.staffSchedule.create({
      data: {
        id: createRandomEntityId(),
        staffId,
        weekday: input.weekday,
        startTime: input.startTime,
        endTime: input.endTime,
        exceptionDate: input.exceptionDate ? new Date(input.exceptionDate) : null,
        coverageNote: input.coverageNote ?? null,
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
    });

    return mapScheduleRecord(created);
  }

  async update(
    scheduleId: EntityId,
    input: StaffScheduleUpdateInput,
    actor: string,
  ): Promise<StaffSchedule> {
    const updated = await this.prisma.staffSchedule.update({
      where: {
        id: scheduleId,
      },
      data: {
        weekday: input.weekday,
        startTime: input.startTime,
        endTime: input.endTime,
        exceptionDate: input.exceptionDate ? new Date(input.exceptionDate) : null,
        coverageNote: input.coverageNote ?? null,
        updatedAt: new Date(),
        updatedBy: actor,
      },
    });

    return mapScheduleRecord(updated);
  }
}

function mapScheduleRecord(record: StaffScheduleRecord): StaffSchedule {
  return {
    id: record.id as StaffSchedule['id'],
    staffId: record.staffId as StaffSchedule['staffId'],
    weekday: record.weekday,
    startTime: record.startTime,
    endTime: record.endTime,
    exceptionDate: record.exceptionDate
      ? toIsoDateString(record.exceptionDate)
      : undefined,
    coverageNote: record.coverageNote ?? undefined,
    audit: {
      createdAt: toIsoDateString(record.createdAt),
      createdBy: record.createdBy,
      updatedAt: toIsoDateString(record.updatedAt),
      updatedBy: record.updatedBy,
      deletedAt: record.deletedAt ? toIsoDateString(record.deletedAt) : undefined,
      deletedBy: record.deletedBy ?? undefined,
    },
  };
}
