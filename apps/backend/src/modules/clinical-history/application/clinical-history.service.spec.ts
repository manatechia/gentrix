import { describe, expect, it } from 'vitest';

import { createResidentSeed, type Resident } from '@gentrix/domain-residents';
import type {
  ClinicalHistoryEvent,
  ClinicalHistoryEventCreateInput,
  ResidentCareStatus,
  ResidentDetail,
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
  resident = createResidentSeed();
  touchedAudit:
    | {
        residentId: string;
        actor: string;
        organizationId?: string;
      }
    | null = null;
  lastCareStatusCall:
    | {
        residentId: string;
        toStatus: ResidentCareStatus;
        actor: string;
        organizationId?: string;
      }
    | null = null;

  async getResidentEntityById(): Promise<Resident> {
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

  async setResidentCareStatus(
    residentId: string,
    toStatus: ResidentCareStatus,
    actor: string,
    organizationId?: string,
  ): Promise<{
    resident: ResidentDetail;
    changed: boolean;
    fromStatus: ResidentCareStatus;
    toStatus: ResidentCareStatus;
  }> {
    this.lastCareStatusCall = {
      residentId,
      toStatus,
      actor,
      organizationId,
    };
    const fromStatus = this.resident.careStatus;
    const changed = fromStatus !== toStatus;

    if (changed) {
      this.resident = { ...this.resident, careStatus: toStatus };
    }

    return {
      resident: this.resident as unknown as ResidentDetail,
      changed,
      fromStatus,
      toStatus,
    };
  }
}

describe('ClinicalHistoryService.create', () => {
  it('crea el evento sin tocar el careStatus si el flag no esta presente', async () => {
    const repository = new ClinicalHistoryRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ClinicalHistoryService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    const result = await service.create(
      residentsService.resident.id,
      buildClinicalHistoryInput(),
      'Sofia Quiroga',
    );

    expect(result.event.audit.createdBy).toBe('Sofia Quiroga');
    expect(result.careStatus).toBeNull();
    expect(residentsService.lastCareStatusCall).toBeNull();
    expect(residentsService.touchedAudit).toEqual({
      residentId: residentsService.resident.id,
      actor: 'Sofia Quiroga',
      organizationId: residentsService.resident.organizationId,
    });
  });

  it('pone al residente en observacion cuando el flag es true', async () => {
    const repository = new ClinicalHistoryRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    const service = new ClinicalHistoryService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    const result = await service.create(
      residentsService.resident.id,
      buildClinicalHistoryInput({ putUnderObservation: true }),
      'Sofia Quiroga',
    );

    expect(result.event.id).toBe('clinical-event-001');
    expect(result.careStatus).toEqual({
      changed: true,
      fromStatus: 'normal',
      toStatus: 'en_observacion',
    });
    expect(residentsService.lastCareStatusCall).toEqual({
      residentId: residentsService.resident.id,
      toStatus: 'en_observacion',
      actor: 'Sofia Quiroga',
      organizationId: residentsService.resident.organizationId,
    });
    // Cuando hay transicion efectiva, NO se llama touchResidentAudit aparte:
    // el repo ya actualiza audit dentro de setCareStatus.
    expect(residentsService.touchedAudit).toBeNull();
  });

  it('si el residente ya estaba en observacion, crea el evento y refresca audit', async () => {
    const repository = new ClinicalHistoryRepositoryStub();
    const residentsService = new ResidentsServiceStub();
    residentsService.resident = {
      ...residentsService.resident,
      careStatus: 'en_observacion',
    };
    const service = new ClinicalHistoryService(
      repository,
      residentsService as unknown as ResidentsService,
    );

    const result = await service.create(
      residentsService.resident.id,
      buildClinicalHistoryInput({ putUnderObservation: true }),
      'Sofia Quiroga',
    );

    expect(result.event.id).toBe('clinical-event-001');
    expect(result.careStatus).toEqual({
      changed: false,
      fromStatus: 'en_observacion',
      toStatus: 'en_observacion',
    });
    expect(residentsService.touchedAudit).toEqual({
      residentId: residentsService.resident.id,
      actor: 'Sofia Quiroga',
      organizationId: residentsService.resident.organizationId,
    });
  });
});

function buildClinicalHistoryInput(
  overrides: Partial<ClinicalHistoryEventCreateInput> = {},
): ClinicalHistoryEventCreateInput {
  return {
    eventType: 'clinical-note',
    title: 'Seguimiento de hidratacion',
    description: 'Se refuerza control de ingesta durante la tarde.',
    occurredAt: '2026-04-14T09:30:00.000Z',
    ...overrides,
  };
}
