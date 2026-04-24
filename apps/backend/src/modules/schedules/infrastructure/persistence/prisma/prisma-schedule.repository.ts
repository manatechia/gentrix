import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  EntityId,
  UserSchedule,
  UserScheduleCreateInput,
  UserScheduleUpdateInput,
} from '@gentrix/shared-types';
import { createRandomEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { ScheduleRepository } from '../../../domain/repositories/schedule.repository';

type ScheduleWithMembership = Prisma.StaffScheduleGetPayload<{
  include: {
    membership: {
      include: {
        user: true;
      };
    };
  };
}>;

const scheduleInclude = {
  membership: {
    include: {
      user: true,
    },
  },
} as const;

@Injectable()
export class PrismaScheduleRepository implements ScheduleRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async listByMembershipId(membershipId: EntityId): Promise<UserSchedule[]> {
    const schedules = await this.prisma.staffSchedule.findMany({
      where: {
        membershipId,
        deletedAt: null,
      },
      include: scheduleInclude,
      orderBy: [
        { exceptionDate: 'asc' },
        { weekday: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return schedules.map(mapScheduleRecord);
  }

  async findById(scheduleId: EntityId): Promise<UserSchedule | null> {
    const schedule = await this.prisma.staffSchedule.findFirst({
      where: {
        id: scheduleId,
        deletedAt: null,
      },
      include: scheduleInclude,
    });

    return schedule ? mapScheduleRecord(schedule) : null;
  }

  async create(
    membershipId: EntityId,
    _userId: EntityId,
    input: UserScheduleCreateInput,
    actor: string,
  ): Promise<UserSchedule> {
    const now = new Date();
    const created = await this.prisma.staffSchedule.create({
      data: {
        id: createRandomEntityId(),
        membershipId,
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
      include: scheduleInclude,
    });

    return mapScheduleRecord(created);
  }

  async update(
    scheduleId: EntityId,
    _userId: EntityId,
    input: UserScheduleUpdateInput,
    actor: string,
  ): Promise<UserSchedule> {
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
      include: scheduleInclude,
    });

    return mapScheduleRecord(updated);
  }
}

function mapScheduleRecord(record: ScheduleWithMembership): UserSchedule {
  return {
    id: record.id as UserSchedule['id'],
    userId: record.membership.user.id as UserSchedule['userId'],
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
