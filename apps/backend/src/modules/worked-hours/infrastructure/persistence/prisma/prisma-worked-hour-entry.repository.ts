import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  EntityId,
  IsoDateString,
  WorkedHourEntry,
} from '@gentrix/shared-types';
import { createRandomEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type {
  WorkedHourEntryCreateRecord,
  WorkedHourEntryRepository,
  WorkedHourEntryUpdateRecord,
} from '../../../domain/repositories/worked-hour-entry.repository';

type EntryRecord = Prisma.WorkedHourEntryGetPayload<{
  include: {
    membership: {
      include: { user: true };
    };
  };
}>;

const entryInclude = {
  membership: {
    include: { user: true },
  },
} as const;

@Injectable()
export class PrismaWorkedHourEntryRepository
  implements WorkedHourEntryRepository
{
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async listByMembership(
    membershipId: EntityId,
    options?: { from?: Date; to?: Date; settled?: boolean },
  ): Promise<WorkedHourEntry[]> {
    const rows = await this.prisma.workedHourEntry.findMany({
      where: {
        membershipId,
        deletedAt: null,
        ...(options?.from || options?.to
          ? {
              workDate: {
                ...(options?.from && { gte: options.from }),
                ...(options?.to && { lte: options.to }),
              },
            }
          : {}),
        ...(options?.settled === true && { settlementId: { not: null } }),
        ...(options?.settled === false && { settlementId: null }),
      },
      include: entryInclude,
      orderBy: [{ workDate: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(mapEntry);
  }

  async findById(id: EntityId): Promise<WorkedHourEntry | null> {
    const row = await this.prisma.workedHourEntry.findFirst({
      where: { id, deletedAt: null },
      include: entryInclude,
    });
    return row ? mapEntry(row) : null;
  }

  async create(
    input: WorkedHourEntryCreateRecord,
  ): Promise<WorkedHourEntry> {
    const now = new Date();
    const row = await this.prisma.workedHourEntry.create({
      data: {
        id: createRandomEntityId(),
        membershipId: input.membershipId,
        workDate: input.workDate,
        hours: input.hours,
        notes: input.notes ?? null,
        createdAt: now,
        createdBy: input.actor,
        updatedAt: now,
        updatedBy: input.actor,
      },
      include: entryInclude,
    });
    return mapEntry(row);
  }

  async update(
    id: EntityId,
    input: WorkedHourEntryUpdateRecord,
  ): Promise<WorkedHourEntry> {
    const row = await this.prisma.workedHourEntry.update({
      where: { id },
      data: {
        ...(input.workDate !== undefined && { workDate: input.workDate }),
        ...(input.hours !== undefined && { hours: input.hours }),
        ...(input.notes !== undefined && { notes: input.notes }),
        updatedAt: new Date(),
        updatedBy: input.actor,
      },
      include: entryInclude,
    });
    return mapEntry(row);
  }

  async softDelete(id: EntityId, actor: string): Promise<void> {
    const now = new Date();
    await this.prisma.workedHourEntry.update({
      where: { id },
      data: {
        deletedAt: now,
        deletedBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
    });
  }
}

export function mapEntry(record: EntryRecord): WorkedHourEntry {
  return {
    id: record.id as WorkedHourEntry['id'],
    userId: record.membership.user.id as WorkedHourEntry['userId'],
    workDate: toIsoDateString(record.workDate) as IsoDateString,
    hours: record.hours.toFixed(2),
    notes: record.notes ?? undefined,
    settlementId: record.settlementId
      ? (record.settlementId as WorkedHourEntry['settlementId'])
      : null,
    appliedRate: record.appliedRate ? record.appliedRate.toFixed(2) : null,
    appliedCurrency: record.appliedCurrency ?? null,
    audit: {
      createdAt: toIsoDateString(record.createdAt),
      updatedAt: toIsoDateString(record.updatedAt),
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      deletedAt: record.deletedAt ? toIsoDateString(record.deletedAt) : undefined,
      deletedBy: record.deletedBy ?? undefined,
    },
  };
}
