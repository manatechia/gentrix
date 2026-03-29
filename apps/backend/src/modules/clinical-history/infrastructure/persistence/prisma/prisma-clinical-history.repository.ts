import { Inject, Injectable } from '@nestjs/common';

import type {
  ClinicalHistoryEvent,
  ClinicalHistoryEventCreateInput,
  EntityId,
} from '@gentrix/shared-types';
import { createRandomEntityId, toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { ClinicalHistoryRepository } from '../../../domain/repositories/clinical-history.repository';

@Injectable()
export class PrismaClinicalHistoryRepository
  implements ClinicalHistoryRepository
{
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async listByResidentId(residentId: EntityId): Promise<ClinicalHistoryEvent[]> {
    const events = await this.prisma.clinicalHistoryEvent.findMany({
      where: {
        residentId,
        deletedAt: null,
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    return events.map((event) => ({
      id: event.id as ClinicalHistoryEvent['id'],
      residentId: event.residentId as ClinicalHistoryEvent['residentId'],
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      occurredAt: toIsoDateString(event.occurredAt),
      audit: {
        createdAt: toIsoDateString(event.createdAt),
        createdBy: event.createdBy,
        updatedAt: toIsoDateString(event.updatedAt),
        updatedBy: event.updatedBy,
        deletedAt: event.deletedAt ? toIsoDateString(event.deletedAt) : undefined,
        deletedBy: event.deletedBy ?? undefined,
      },
    }));
  }

  async create(
    residentId: EntityId,
    input: ClinicalHistoryEventCreateInput,
    actor: string,
  ): Promise<ClinicalHistoryEvent> {
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
    const created = await this.prisma.clinicalHistoryEvent.create({
      data: {
        id: createRandomEntityId(),
        organizationId: resident.organizationId,
        facilityId: resident.facilityId,
        residentId,
        eventType: input.eventType.trim(),
        title: input.title.trim(),
        description: input.description.trim(),
        occurredAt: new Date(input.occurredAt),
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
      },
    });

    return {
      id: created.id as ClinicalHistoryEvent['id'],
      residentId: created.residentId as ClinicalHistoryEvent['residentId'],
      eventType: created.eventType,
      title: created.title,
      description: created.description,
      occurredAt: toIsoDateString(created.occurredAt),
      audit: {
        createdAt: toIsoDateString(created.createdAt),
        createdBy: created.createdBy,
        updatedAt: toIsoDateString(created.updatedAt),
        updatedBy: created.updatedBy,
      },
    };
  }
}
