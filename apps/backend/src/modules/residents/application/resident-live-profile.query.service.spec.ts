import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  createMedicationSeed,
  type MedicationOrder,
} from '@gentrix/domain-medication';
import {
  createResidentSeed,
  type Resident,
} from '@gentrix/domain-residents';
import type { ResidentEvent } from '@gentrix/shared-types';

import type { MedicationRepository } from '../../medication/domain/repositories/medication.repository';
import type {
  ResidentRepository,
} from '../domain/repositories/resident.repository';
import { ResidentLiveProfileQueryService } from './resident-live-profile.query.service';

class ResidentRepositoryStub implements ResidentRepository {
  constructor(
    private readonly resident: Resident,
    private readonly residentEvents: ResidentEvent[],
  ) {}

  async list(): Promise<Resident[]> {
    return [cloneResident(this.resident)];
  }

  async findById(id: string): Promise<Resident | null> {
    return this.resident.id === id ? cloneResident(this.resident) : null;
  }

  async create(resident: Resident): Promise<Resident> {
    return cloneResident(resident);
  }

  async update(resident: Resident): Promise<Resident> {
    return cloneResident(resident);
  }

  async listEventsByResidentId(residentId: string): Promise<ResidentEvent[]> {
    return this.residentEvents
      .filter((event) => event.residentId === residentId)
      .map(cloneResidentEvent);
  }

  async createEvent(): Promise<ResidentEvent> {
    throw new Error('Not implemented in query tests.');
  }
}

class MedicationRepositoryStub implements MedicationRepository {
  constructor(private readonly medications: MedicationOrder[]) {}

  async list(): Promise<MedicationOrder[]> {
    return this.medications.map(cloneMedicationOrder);
  }

  async listByResidentId(residentId: string): Promise<MedicationOrder[]> {
    return this.medications
      .filter((order) => order.residentId === residentId)
      .map(cloneMedicationOrder);
  }

  async findById(id: string): Promise<MedicationOrder | null> {
    const medication = this.medications.find((order) => order.id === id);
    return medication ? cloneMedicationOrder(medication) : null;
  }

  async create(order: MedicationOrder): Promise<MedicationOrder> {
    return cloneMedicationOrder(order);
  }

  async update(order: MedicationOrder): Promise<MedicationOrder> {
    return cloneMedicationOrder(order);
  }
}

describe('ResidentLiveProfileQueryService', () => {
  it('returns base resident data, active medications and recent events in one payload', async () => {
    const resident = createResidentSeed({
      id: 'resident-001',
      firstName: 'Marta',
      lastName: 'Diaz',
      room: 'B-204',
      careLevel: 'assisted',
    });
    const residents = new ResidentRepositoryStub(resident, [
      createResidentEventSeed({
        id: 'event-1',
        residentId: resident.id,
        title: 'Seguimiento nocturno',
        occurredAt: '2026-03-25T21:30:00.000Z',
      }),
      createResidentEventSeed({
        id: 'event-2',
        residentId: resident.id,
        title: 'Control semanal',
        occurredAt: '2026-03-24T09:00:00.000Z',
      }),
      createResidentEventSeed({
        id: 'event-3',
        residentId: resident.id,
        title: 'Interconsulta',
        occurredAt: '2026-03-23T11:00:00.000Z',
      }),
      createResidentEventSeed({
        id: 'event-4',
        residentId: resident.id,
        title: 'Observacion',
        occurredAt: '2026-03-22T10:00:00.000Z',
      }),
      createResidentEventSeed({
        id: 'event-5',
        residentId: resident.id,
        title: 'Nota de ingreso',
        occurredAt: '2026-03-21T08:00:00.000Z',
        eventType: 'admission-note',
      }),
      createResidentEventSeed({
        id: 'event-6',
        residentId: resident.id,
        title: 'Evento mas viejo',
        occurredAt: '2026-03-20T07:00:00.000Z',
      }),
    ]);
    const medications = new MedicationRepositoryStub([
      createMedicationSeed(resident.id, {
        id: 'medication-active',
        medicationName: 'Paracetamol',
        dose: '500 mg',
        startDate: '2026-03-01T00:00:00.000Z',
        status: 'active',
      }),
      createMedicationSeed(resident.id, {
        id: 'medication-ended',
        medicationName: 'Lorazepam',
        dose: '1 mg',
        startDate: '2026-02-01T00:00:00.000Z',
        endDate: '2026-02-15T00:00:00.000Z',
        status: 'active',
      }),
      createMedicationSeed('resident-other', {
        id: 'medication-other-resident',
        medicationName: 'Ibuprofeno',
        dose: '400 mg',
      }),
    ]);
    const service = new ResidentLiveProfileQueryService(residents, medications);

    const profile = await service.getResidentLiveProfile(
      resident.id,
      resident.organizationId,
    );

    expect(profile.resident).toMatchObject({
      id: resident.id,
      fullName: 'Marta Diaz',
      room: 'B-204',
      careLevel: 'assisted',
      documentNumber: resident.documentNumber,
    });
    expect(profile.activeMedications).toHaveLength(1);
    expect(profile.activeMedications[0]).toMatchObject({
      id: 'medication-active',
      medicationName: 'Paracetamol',
      residentId: resident.id,
      residentName: 'Marta Diaz',
      active: true,
    });
    expect(profile.recentEvents.map((event) => event.id)).toEqual([
      'event-1',
      'event-2',
      'event-3',
      'event-4',
      'event-5',
    ]);
  });

  it('fails when the resident does not exist', async () => {
    const resident = createResidentSeed();
    const residents = new ResidentRepositoryStub(resident, []);
    const medications = new MedicationRepositoryStub([]);
    const service = new ResidentLiveProfileQueryService(residents, medications);

    await expect(
      service.getResidentLiveProfile('resident-missing', resident.organizationId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function createResidentEventSeed(
  overrides: Partial<ResidentEvent> = {},
): ResidentEvent {
  return {
    id: 'resident-event-seed',
    residentId: 'resident-001',
    eventType: 'follow-up',
    title: 'Seguimiento simple',
    description: 'Se observa evolucion estable.',
    occurredAt: '2026-03-25T11:00:00.000Z',
    actor: 'seed-script',
    audit: {
      createdAt: '2026-03-25T11:00:00.000Z',
      updatedAt: '2026-03-25T11:00:00.000Z',
      createdBy: 'seed-script',
      updatedBy: 'seed-script',
    },
    ...overrides,
  };
}

function cloneResident(resident: Resident): Resident {
  return {
    ...resident,
    medicalHistory: resident.medicalHistory.map((entry) => ({ ...entry })),
    attachments: resident.attachments.map((attachment) => ({ ...attachment })),
    insurance: { ...resident.insurance },
    transfer: { ...resident.transfer },
    psychiatry: { ...resident.psychiatry },
    clinicalProfile: { ...resident.clinicalProfile },
    belongings: { ...resident.belongings },
    familyContacts: resident.familyContacts.map((contact) => ({ ...contact })),
    discharge: { ...resident.discharge },
    address: { ...resident.address },
    emergencyContact: { ...resident.emergencyContact },
    audit: { ...resident.audit },
  };
}

function cloneResidentEvent(event: ResidentEvent): ResidentEvent {
  return {
    ...event,
    audit: { ...event.audit },
  };
}

function cloneMedicationOrder(order: MedicationOrder): MedicationOrder {
  return {
    ...order,
    scheduleTimes: [...order.scheduleTimes],
    audit: { ...order.audit },
  };
}
