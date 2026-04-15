import { Inject, Injectable } from '@nestjs/common';

import type {
  EntityId,
  ResidentAgendaOccurrenceOverrideInput,
  ResidentAgendaRecurrenceType,
  ResidentAgendaSeries,
  ResidentAgendaSeriesCreateInput,
  ResidentAgendaSeriesUpdateInput,
} from '@gentrix/shared-types';
import { createRandomEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { SeriesExceptionRecord } from '../../../domain/occurrence-expansion';
import type { ResidentAgendaSeriesRepository } from '../../../domain/repositories/resident-agenda-series.repository';

type SeriesRow = {
  id: string;
  organizationId: string;
  facilityId: string | null;
  residentId: string;
  title: string;
  description: string | null;
  recurrenceType: string;
  recurrenceDaysOfWeek: number[];
  timeOfDay: string;
  startsOn: Date;
  endsOn: Date | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date | null;
  deletedBy: string | null;
};

type ExceptionRow = {
  id: string;
  seriesId: string;
  occurrenceDate: Date;
  action: string;
  overrideTitle: string | null;
  overrideDescription: string | null;
  overrideScheduledAt: Date | null;
};

@Injectable()
export class PrismaResidentAgendaSeriesRepository
  implements ResidentAgendaSeriesRepository
{
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async listActiveByResidentId(
    residentId: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentAgendaSeries[]> {
    const rows = (await this.prisma.residentAgendaSeries.findMany({
      where: { residentId, organizationId, deletedAt: null },
      orderBy: [{ startsOn: 'asc' }],
    })) as SeriesRow[];
    return rows.map(mapSeriesRow);
  }

  async listActiveByOrganization(
    organizationId: EntityId,
  ): Promise<ResidentAgendaSeries[]> {
    const rows = (await this.prisma.residentAgendaSeries.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ startsOn: 'asc' }],
    })) as SeriesRow[];
    return rows.map(mapSeriesRow);
  }

  async listExceptionsForSeries(
    seriesIds: EntityId[],
    fromDate: string,
    toDate: string,
  ): Promise<SeriesExceptionRecord[]> {
    if (seriesIds.length === 0) return [];
    const rows = (await this.prisma.residentAgendaSeriesException.findMany({
      where: {
        seriesId: { in: seriesIds as unknown as string[] },
        occurrenceDate: {
          gte: new Date(`${fromDate}T00:00:00.000Z`),
          lte: new Date(`${toDate}T00:00:00.000Z`),
        },
      },
    })) as ExceptionRow[];
    return rows.map(mapExceptionRow);
  }

  async findSeriesById(
    seriesId: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentAgendaSeries | null> {
    const row = (await this.prisma.residentAgendaSeries.findFirst({
      where: { id: seriesId, organizationId, deletedAt: null },
    })) as SeriesRow | null;
    return row ? mapSeriesRow(row) : null;
  }

  async createSeries(
    residentId: EntityId,
    input: ResidentAgendaSeriesCreateInput,
    actor: string,
  ): Promise<ResidentAgendaSeries> {
    const resident = await this.prisma.resident.findFirstOrThrow({
      where: { id: residentId, deletedAt: null },
      select: { organizationId: true, facilityId: true },
    });
    const now = new Date();
    const row = (await this.prisma.residentAgendaSeries.create({
      data: {
        id: createRandomEntityId(),
        organizationId: resident.organizationId,
        facilityId: resident.facilityId,
        residentId,
        title: input.title,
        description: input.description ?? null,
        recurrenceType: input.recurrenceType,
        recurrenceDaysOfWeek: input.recurrenceDaysOfWeek ?? [],
        timeOfDay: input.timeOfDay,
        startsOn: new Date(`${input.startsOn.slice(0, 10)}T00:00:00.000Z`),
        endsOn: input.endsOn
          ? new Date(`${input.endsOn.slice(0, 10)}T00:00:00.000Z`)
          : null,
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
    })) as SeriesRow;
    return mapSeriesRow(row);
  }

  async updateSeries(
    seriesId: EntityId,
    input: ResidentAgendaSeriesUpdateInput,
    actor: string,
    organizationId: EntityId,
  ): Promise<ResidentAgendaSeries> {
    const now = new Date();
    const result = await this.prisma.residentAgendaSeries.updateMany({
      where: { id: seriesId, organizationId, deletedAt: null },
      data: {
        title: input.title,
        description: input.description ?? null,
        recurrenceType: input.recurrenceType,
        recurrenceDaysOfWeek: input.recurrenceDaysOfWeek ?? [],
        timeOfDay: input.timeOfDay,
        startsOn: new Date(`${input.startsOn.slice(0, 10)}T00:00:00.000Z`),
        endsOn: input.endsOn
          ? new Date(`${input.endsOn.slice(0, 10)}T00:00:00.000Z`)
          : null,
        updatedAt: now,
        updatedBy: actor,
      },
    });
    if (result.count === 0) {
      throw new Error(`ResidentAgendaSeries ${seriesId} not found.`);
    }
    const row = (await this.prisma.residentAgendaSeries.findFirstOrThrow({
      where: { id: seriesId },
    })) as SeriesRow;
    return mapSeriesRow(row);
  }

  async softDeleteSeries(
    seriesId: EntityId,
    actor: string,
    organizationId: EntityId,
  ): Promise<void> {
    const now = new Date();
    const result = await this.prisma.residentAgendaSeries.updateMany({
      where: { id: seriesId, organizationId, deletedAt: null },
      data: {
        deletedAt: now,
        deletedBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
    });
    if (result.count === 0) {
      throw new Error(`ResidentAgendaSeries ${seriesId} not found.`);
    }
  }

  async skipOccurrence(
    seriesId: EntityId,
    occurrenceDate: string,
    actor: string,
  ): Promise<SeriesExceptionRecord> {
    const now = new Date();
    const row = (await this.prisma.residentAgendaSeriesException.upsert({
      where: {
        seriesId_occurrenceDate: {
          seriesId,
          occurrenceDate: new Date(`${occurrenceDate}T00:00:00.000Z`),
        },
      },
      create: {
        id: createRandomEntityId(),
        seriesId,
        occurrenceDate: new Date(`${occurrenceDate}T00:00:00.000Z`),
        action: 'skip',
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
      update: {
        action: 'skip',
        overrideTitle: null,
        overrideDescription: null,
        overrideScheduledAt: null,
        updatedAt: now,
        updatedBy: actor,
      },
    })) as ExceptionRow;
    return mapExceptionRow(row);
  }

  async overrideOccurrence(
    seriesId: EntityId,
    occurrenceDate: string,
    input: ResidentAgendaOccurrenceOverrideInput,
    actor: string,
  ): Promise<SeriesExceptionRecord> {
    const now = new Date();
    const row = (await this.prisma.residentAgendaSeriesException.upsert({
      where: {
        seriesId_occurrenceDate: {
          seriesId,
          occurrenceDate: new Date(`${occurrenceDate}T00:00:00.000Z`),
        },
      },
      create: {
        id: createRandomEntityId(),
        seriesId,
        occurrenceDate: new Date(`${occurrenceDate}T00:00:00.000Z`),
        action: 'override',
        overrideTitle: input.title,
        overrideDescription: input.description ?? null,
        overrideScheduledAt: input.overrideScheduledAt
          ? new Date(input.overrideScheduledAt)
          : null,
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
      update: {
        action: 'override',
        overrideTitle: input.title,
        overrideDescription: input.description ?? null,
        overrideScheduledAt: input.overrideScheduledAt
          ? new Date(input.overrideScheduledAt)
          : null,
        updatedAt: now,
        updatedBy: actor,
      },
    })) as ExceptionRow;
    return mapExceptionRow(row);
  }

  async clearException(
    seriesId: EntityId,
    occurrenceDate: string,
  ): Promise<void> {
    await this.prisma.residentAgendaSeriesException.deleteMany({
      where: {
        seriesId,
        occurrenceDate: new Date(`${occurrenceDate}T00:00:00.000Z`),
      },
    });
  }

  async getOrganizationTimezone(organizationId: EntityId): Promise<string> {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId },
      select: { timezone: true },
    });
    return org?.timezone || 'UTC';
  }
}

function mapSeriesRow(row: SeriesRow): ResidentAgendaSeries {
  return {
    id: row.id as ResidentAgendaSeries['id'],
    residentId: row.residentId as ResidentAgendaSeries['residentId'],
    title: row.title,
    description: row.description ?? undefined,
    recurrenceType: row.recurrenceType as ResidentAgendaRecurrenceType,
    recurrenceDaysOfWeek: row.recurrenceDaysOfWeek ?? [],
    timeOfDay: row.timeOfDay,
    startsOn: row.startsOn.toISOString().slice(0, 10),
    endsOn: row.endsOn ? row.endsOn.toISOString().slice(0, 10) : undefined,
    audit: {
      createdAt: toIsoDateString(row.createdAt),
      createdBy: row.createdBy,
      updatedAt: toIsoDateString(row.updatedAt),
      updatedBy: row.updatedBy,
      deletedAt: row.deletedAt ? toIsoDateString(row.deletedAt) : undefined,
      deletedBy: row.deletedBy ?? undefined,
    },
  };
}

function mapExceptionRow(row: ExceptionRow): SeriesExceptionRecord {
  return {
    id: row.id as SeriesExceptionRecord['id'],
    seriesId: row.seriesId as SeriesExceptionRecord['seriesId'],
    occurrenceDate: row.occurrenceDate.toISOString().slice(0, 10),
    action: row.action as 'skip' | 'override',
    overrideTitle: row.overrideTitle,
    overrideDescription: row.overrideDescription,
    overrideScheduledAt: row.overrideScheduledAt
      ? row.overrideScheduledAt.toISOString()
      : null,
  };
}
