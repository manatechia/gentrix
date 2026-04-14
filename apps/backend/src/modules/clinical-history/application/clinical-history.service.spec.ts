import { describe, expect, it } from 'vitest';

import { createResidentSeed } from '@gentrix/domain-residents';
import type {
  ClinicalHistoryEvent,
  ClinicalHistoryEventCreateInput,
} from '@gentrix/shared-types';

import { ResidentsService } from '../../residents/application/residents.service';
import type { ClinicalHistoryRepository } from '../domain/repositories/clinical-history.repository';
import { ClinicalHistoryService } from './clinical-history.service';

class ClinicalHistoryRepositoryStub implements ClinicalHistoryRepository {
  lastCreate:
    | {
        residentId: string;
        input: ClinicalHistoryEventCreateInput;
        actor: string;
      }
    | null = null;

  async listByResidentId(): Promise<ClinicalHistoryEvent[]> {
    return [];
  }

  async create(
    residentId: string,
    input: ClinicalHistoryEventCreateInput,
    actor: string,
  ): Promise<ClinicalHistoryEvent> {
    this.lastCreate = {
      residentId,
      input: { ...input },
      actor,
    };

    return {
      id: 'clinical-event-001',
      residentId: residentId as ClinicalHistoryEvent['residentId'],
      eventType: input.eventType,
      title: input.title,
      description: input.description,
      occurredAt: input.occurredAt,
      audit: {
        createdAt: input.occurredAt,
        updatedAt: input.occurredAt,
        createdBy: actor,
        updatedBy: actor,
      },
    };
  }
}

class ResidentsServiceStub {
  readonly resident = createResidentSeed();
  touchedAudit:
    | {
        residentId: string;
        actor: string;
        organizationId?: string;
      }
    | null = null;

  async getResidentEntityById() {
    return this.resident;
  }

  async touchResidentAudit(
    residentId: string,
    actor: string,
    organizationId?: string,
  ): Promise<void> {
    this.touchedAudit = {
      residentId,
      actor,
      organizationId,
    };
  }
}

describe('ClinicalHistoryService.create', () => {
  it('touches resident audit after creating the event', async () => {
    const repository = new ClinicalHistoryRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ClinicalHistoryService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    const created = await service.create(
      residentsService.resident.id,
      buildClinicalHistoryInput(),
      'Sofia Quiroga',
    );

    expect(created.audit.createdBy).toBe('Sofia Quiroga');
    expect(repository.lastCreate).toEqual({
      residentId: residentsService.resident.id,
      input: buildClinicalHistoryInput(),
      actor: 'Sofia Quiroga',
    });
    expect(residentsService.touchedAudit).toEqual({
      residentId: residentsService.resident.id,
      actor: 'Sofia Quiroga',
      organizationId: residentsService.resident.organizationId,
    });
  });
});

function buildClinicalHistoryInput(): ClinicalHistoryEventCreateInput {
  return {
    eventType: 'clinical-note',
    title: 'Seguimiento de hidratacion',
    description: 'Se refuerza control de ingesta durante la tarde.',
    occurredAt: '2026-04-14T09:30:00.000Z',
  };
}
