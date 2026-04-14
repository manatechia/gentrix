import { describe, expect, it } from 'vitest';

import {
  createMedicationCatalogSeed,
  createMedicationSeed,
  type MedicationExecution,
  type MedicationOrder,
} from '@gentrix/domain-medication';
import { createResidentSeed } from '@gentrix/domain-residents';
import type {
  EntityId,
  MedicationCatalogItem,
  MedicationCreateInput,
  MedicationExecutionCreateInput,
  MedicationUpdateInput,
  ResidentDetail,
} from '@gentrix/shared-types';

import { ResidentsService } from '../../residents/application/residents.service';
import type { MedicationCatalogRepository } from '../domain/repositories/medication-catalog.repository';
import type { MedicationExecutionRepository } from '../domain/repositories/medication-execution.repository';
import type { MedicationRepository } from '../domain/repositories/medication.repository';
import { MedicationService } from './medication.service';

class ResidentsServiceStub {
  readonly resident = createResidentSeed();
  touchedAudit:
    | {
        residentId: string;
        actor: string;
        organizationId?: string;
      }
    | null = null;

  async getResidentEntityById(): Promise<typeof this.resident> {
    return this.resident;
  }

  async getResidentById(): Promise<ResidentDetail> {
    return {
      ...this.resident,
      fullName: 'Marta Diaz',
      age: 83,
    };
  }

  async getResidents() {
    return [
      {
        id: this.resident.id,
        fullName: 'Marta Diaz',
        age: 83,
        room: this.resident.room,
        careLevel: this.resident.careLevel,
        status: this.resident.status,
      },
    ];
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

class MedicationRepositoryStub implements MedicationRepository {
  order: MedicationOrder;

  constructor(order: MedicationOrder) {
    this.order = cloneMedicationOrder(order);
  }

  async list(): Promise<MedicationOrder[]> {
    return [cloneMedicationOrder(this.order)];
  }

  async listByResidentId(): Promise<MedicationOrder[]> {
    return [cloneMedicationOrder(this.order)];
  }

  async findById(id: string): Promise<MedicationOrder | null> {
    return this.order.id === id ? cloneMedicationOrder(this.order) : null;
  }

  async create(order: MedicationOrder): Promise<MedicationOrder> {
    this.order = cloneMedicationOrder(order);
    return cloneMedicationOrder(this.order);
  }

  async update(order: MedicationOrder): Promise<MedicationOrder> {
    this.order = cloneMedicationOrder(order);
    return cloneMedicationOrder(this.order);
  }
}

class MedicationExecutionRepositoryStub implements MedicationExecutionRepository {
  lastCreated: MedicationExecution | null = null;

  async list(): Promise<MedicationExecution[]> {
    return [];
  }

  async listByMedicationOrderId(): Promise<MedicationExecution[]> {
    return [];
  }

  async listByResidentId(): Promise<MedicationExecution[]> {
    return [];
  }

  async create(execution: MedicationExecution): Promise<MedicationExecution> {
    this.lastCreated = cloneMedicationExecution(execution);
    return cloneMedicationExecution(execution);
  }
}

class MedicationCatalogRepositoryStub implements MedicationCatalogRepository {
  constructor(private readonly item: MedicationCatalogItem) {}

  async list(): Promise<MedicationCatalogItem[]> {
    return [this.item];
  }

  async findById(id: string): Promise<MedicationCatalogItem | null> {
    return this.item.id === id ? { ...this.item } : null;
  }
}

describe('MedicationService audit trail', () => {
  it('touches resident audit when creating a medication order', async () => {
    const residentsService = new ResidentsServiceStub();
    const catalogItem = createMedicationCatalogSeed({
      id: 'medication-catalog-001',
      medicationName: 'Paracetamol',
    });
    const medicationRepository = new MedicationRepositoryStub(
      createMedicationSeed(residentsService.resident.id),
    );
    const service = new MedicationService(
      medicationRepository,
      new MedicationExecutionRepositoryStub(),
      new MedicationCatalogRepositoryStub(catalogItem),
      residentsService as unknown as ResidentsService,
    );

    const created = await service.createMedication(
      buildMedicationCreateInput(residentsService.resident.id, catalogItem.id),
      'Sofia Quiroga',
      residentsService.resident.organizationId,
    );

    expect(created.audit.createdBy).toBe('Sofia Quiroga');
    expect(residentsService.touchedAudit).toEqual({
      residentId: residentsService.resident.id,
      actor: 'Sofia Quiroga',
      organizationId: residentsService.resident.organizationId,
    });
  });

  it('touches resident audit when updating a medication order', async () => {
    const residentsService = new ResidentsServiceStub();
    const existingOrder = createMedicationSeed(residentsService.resident.id);
    const catalogItem = createMedicationCatalogSeed({
      id: existingOrder.medicationCatalogId,
      medicationName: 'Paracetamol',
    });
    const service = new MedicationService(
      new MedicationRepositoryStub(existingOrder),
      new MedicationExecutionRepositoryStub(),
      new MedicationCatalogRepositoryStub(catalogItem),
      residentsService as unknown as ResidentsService,
    );

    const updated = await service.updateMedication(
      existingOrder.id,
      buildMedicationUpdateInput(existingOrder),
      'Sofia Quiroga',
      residentsService.resident.organizationId,
    );

    expect(updated.audit.updatedBy).toBe('Sofia Quiroga');
    expect(residentsService.touchedAudit).toEqual({
      residentId: residentsService.resident.id,
      actor: 'Sofia Quiroga',
      organizationId: residentsService.resident.organizationId,
    });
  });

  it('touches resident audit when recording a medication execution', async () => {
    const residentsService = new ResidentsServiceStub();
    const existingOrder = createMedicationSeed(residentsService.resident.id);
    const executionRepository = new MedicationExecutionRepositoryStub();
    const service = new MedicationService(
      new MedicationRepositoryStub(existingOrder),
      executionRepository,
      new MedicationCatalogRepositoryStub(
        createMedicationCatalogSeed({
          id: existingOrder.medicationCatalogId,
          medicationName: existingOrder.medicationName,
        }),
      ),
      residentsService as unknown as ResidentsService,
    );

    const execution = await service.createMedicationExecution(
      existingOrder.id,
      buildMedicationExecutionInput(existingOrder),
      'Sofia Quiroga',
      residentsService.resident.organizationId,
    );

    expect(execution.actor).toBe('Sofia Quiroga');
    expect(executionRepository.lastCreated?.audit.createdBy).toBe(
      'Sofia Quiroga',
    );
    expect(residentsService.touchedAudit).toEqual({
      residentId: residentsService.resident.id,
      actor: 'Sofia Quiroga',
      organizationId: residentsService.resident.organizationId,
    });
  });
});

function buildMedicationCreateInput(
  residentId: EntityId,
  medicationCatalogId: EntityId,
): MedicationCreateInput {
  return {
    medicationCatalogId,
    residentId,
    dose: '500 mg',
    route: 'oral',
    frequency: 'twice-daily',
    scheduleTimes: ['09:00', '21:00'],
    prescribedBy: 'Dra. Lucia Mendez',
    startDate: '2026-04-01T00:00:00.000Z',
    status: 'active',
  };
}

function buildMedicationUpdateInput(order: MedicationOrder): MedicationUpdateInput {
  return {
    medicationCatalogId: order.medicationCatalogId,
    residentId: order.residentId,
    dose: order.dose,
    route: order.route,
    frequency: order.frequency,
    scheduleTimes: [...order.scheduleTimes],
    prescribedBy: order.prescribedBy,
    startDate: order.startDate,
    endDate: order.endDate,
    status: order.status,
  };
}

function buildMedicationExecutionInput(
  order: MedicationOrder,
): MedicationExecutionCreateInput {
  return {
    occurredAt: order.startDate,
    result: 'administered',
  };
}

function cloneMedicationOrder(order: MedicationOrder): MedicationOrder {
  return {
    ...order,
    scheduleTimes: [...order.scheduleTimes],
    audit: { ...order.audit },
  };
}

function cloneMedicationExecution(
  execution: MedicationExecution,
): MedicationExecution {
  return {
    ...execution,
    audit: { ...execution.audit },
  };
}
