import { Inject, Injectable } from '@nestjs/common';

import type {
  EntityId,
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaEventWithResident,
} from '@gentrix/shared-types';
import { createRandomEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { ResidentAgendaRepository } from '../../../domain/repositories/resident-agenda.repository';

type AgendaRow = {
  id: string;
  organizationId: string;
  facilityId: string | null;
  residentId: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date | null;
  deletedBy: string | null;
};

@Injectable()
export class PrismaResidentAgendaRepository implements ResidentAgendaRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async listUpcomingByResidentId(
    residentId: EntityId,
    now: Date,
    organizationId?: EntityId,
  ): Promise<ResidentAgendaEvent[]> {
    const events = (await this.prisma.residentAgendaEvent.findMany({
      where: {
        residentId,
        deletedAt: null,
        scheduledAt: { gte: now },
        ...(organizationId ? { organizationId } : {}),
      },
      orderBy: [{ scheduledAt: 'asc' }],
    })) as AgendaRow[];

    return events.map(mapRowToAgendaEvent);
  }

  async listUpcomingByOrganization(
    organizationId: EntityId,
    now: Date,
    limit: number,
  ): Promise<ResidentAgendaEventWithResident[]> {
    const events = (await this.prisma.residentAgendaEvent.findMany({
      where: {
        organizationId,
        deletedAt: null,
        scheduledAt: { gte: now },
      },
      orderBy: [{ scheduledAt: 'asc' }],
      take: limit,
      include: {
        resident: {
          select: {
            firstName: true,
            lastName: true,
            room: true,
          },
        },
      },
    })) as Array<
      AgendaRow & {
        resident: { firstName: string; lastName: string; room: string };
      }
    >;

    return events.map((event) => ({
      ...mapRowToAgendaEvent(event),
      residentFullName:
        `${event.resident.firstName} ${event.resident.lastName}`.trim(),
      residentRoom: event.resident.room,
    }));
  }

  async findById(
    eventId: EntityId,
    organizationId?: EntityId,
  ): Promise<ResidentAgendaEvent | null> {
    const event = (await this.prisma.residentAgendaEvent.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
        ...(organizationId ? { organizationId } : {}),
      },
    })) as AgendaRow | null;

    return event ? mapRowToAgendaEvent(event) : null;
  }

  async create(
    residentId: EntityId,
    input: ResidentAgendaEventCreateInput,
    actor: string,
  ): Promise<ResidentAgendaEvent> {
    const resident = await this.prisma.resident.findFirstOrThrow({
      where: {
        id: residentId,
        deletedAt: null,
      },
      select: {
        organizationId: true,
        facilityId: true,
      },
    });

    const now = new Date();
    const created = (await this.prisma.residentAgendaEvent.create({
      data: {
        id: createRandomEntityId(),
        organizationId: resident.organizationId,
        facilityId: resident.facilityId,
        residentId,
        title: input.title,
        description: input.description ?? null,
        scheduledAt: new Date(input.scheduledAt),
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
    })) as AgendaRow;

    return mapRowToAgendaEvent(created);
  }

  async update(
    eventId: EntityId,
    input: ResidentAgendaEventUpdateInput,
    actor: string,
    organizationId?: EntityId,
  ): Promise<ResidentAgendaEvent> {
    // updateMany + re-read mantiene el contrato multi-tenant sin exponer un
    // registro cruzado de otra organización aunque coincida el id.
    const now = new Date();
    const result = await this.prisma.residentAgendaEvent.updateMany({
      where: {
        id: eventId,
        deletedAt: null,
        ...(organizationId ? { organizationId } : {}),
      },
      data: {
        title: input.title,
        description: input.description ?? null,
        scheduledAt: new Date(input.scheduledAt),
        updatedAt: now,
        updatedBy: actor,
      },
    });

    if (result.count === 0) {
      throw new Error(`ResidentAgendaEvent ${eventId} not found.`);
    }

    const updated = (await this.prisma.residentAgendaEvent.findFirstOrThrow({
      where: { id: eventId },
    })) as AgendaRow;

    return mapRowToAgendaEvent(updated);
  }

  async softDelete(
    eventId: EntityId,
    actor: string,
    organizationId?: EntityId,
  ): Promise<void> {
    const now = new Date();
    const result = await this.prisma.residentAgendaEvent.updateMany({
      where: {
        id: eventId,
        deletedAt: null,
        ...(organizationId ? { organizationId } : {}),
      },
      data: {
        deletedAt: now,
        deletedBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
    });

    if (result.count === 0) {
      throw new Error(`ResidentAgendaEvent ${eventId} not found.`);
    }
  }
}

function mapRowToAgendaEvent(row: AgendaRow): ResidentAgendaEvent {
  return {
    id: row.id as ResidentAgendaEvent['id'],
    residentId: row.residentId as ResidentAgendaEvent['residentId'],
    title: row.title,
    description: row.description ?? undefined,
    scheduledAt: toIsoDateString(row.scheduledAt),
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
