import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { createResidentSeed, type Resident } from '@gentrix/domain-residents';
import type {
  ResidentEvent,
  ResidentEventCreateInput,
  ResidentUpdateInput,
} from '@gentrix/shared-types';

import type {
  ResidentEventRecordInput,
  ResidentRepository,
} from '../domain/repositories/resident.repository';
import { ResidentsService } from './residents.service';

class ResidentRepositoryStub implements ResidentRepository {
  private resident: Resident;
  private residentEvents: ResidentEvent[] = [];
  lastUpdatedResident: Resident | null = null;
  lastCreatedEvent: ResidentEventRecordInput | null = null;
  lastTouchedAudit:
    | {
        residentId: Resident['id'];
        actor: string;
        organizationId?: Resident['organizationId'];
      }
    | null = null;

  constructor(resident: Resident) {
    this.resident = cloneResident(resident);
  }

  async list(): Promise<Resident[]> {
    return [cloneResident(this.resident)];
  }

  async findById(id: string): Promise<Resident | null> {
    return this.resident.id === id ? cloneResident(this.resident) : null;
  }

  async create(resident: Resident): Promise<Resident> {
    this.resident = cloneResident(resident);
    return cloneResident(this.resident);
  }

  async update(resident: Resident): Promise<Resident> {
    this.lastUpdatedResident = cloneResident(resident);
    this.resident = cloneResident(resident);
    return cloneResident(this.resident);
  }

  async touchAudit(
    residentId: Resident['id'],
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<void> {
    this.lastTouchedAudit = {
      residentId,
      actor,
      organizationId,
    };
    this.resident = {
      ...this.resident,
      audit: {
        ...this.resident.audit,
        updatedAt: '2026-03-25T21:00:00.000Z',
        updatedBy: actor,
      },
    };
  }

  async listEvents(): Promise<ResidentEvent[]> {
    return this.residentEvents.map(cloneResidentEvent);
  }

  async listEventsByResidentId(residentId: string): Promise<ResidentEvent[]> {
    return this.residentEvents
      .filter((event) => event.residentId === residentId)
      .map(cloneResidentEvent);
  }

  async createEvent(event: ResidentEventRecordInput): Promise<ResidentEvent> {
    this.lastCreatedEvent = { ...event };
    const createdEvent: ResidentEvent = {
      id: 'resident-event-001',
      residentId: event.residentId,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      occurredAt: event.occurredAt,
      actor: event.actor,
      audit: {
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
        createdBy: event.actor,
        updatedBy: event.actor,
      },
    };
    this.residentEvents = [createdEvent, ...this.residentEvents];
    return cloneResidentEvent(createdEvent);
  }

  seedEvents(events: ResidentEvent[]): void {
    this.residentEvents = events.map(cloneResidentEvent);
  }
}

describe('ResidentsService.updateResident', () => {
  it('preserves supporting record ids when only base data changes', async () => {
    const resident = createResidentSeed({
      attachments: [
        {
          id: 'resident-attachment-001',
          fileName: 'consentimiento.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
          dataUrl: 'data:application/pdf;base64,ZmFrZQ==',
          kind: 'pdf',
          uploadedAt: '2026-01-10T09:00:00.000Z',
        },
      ],
      familyContacts: [
        {
          id: 'resident-family-contact-001',
          fullName: 'Laura Perez',
          relationship: 'Hija',
          phone: '+54 11 5555-0101',
          email: 'laura.perez@familia.local',
          address: 'Paysandu 1402, CABA',
          notes: 'Coordina tramites y acompanamiento en consultas.',
        },
      ],
      medicalHistory: [
        {
          id: 'resident-history-001',
          recordedAt: '2025-11-12T00:00:00.000Z',
          title: 'Hipertension arterial',
          notes: 'Controlada con seguimiento ambulatorio.',
          createdAt: '2026-01-10T09:00:00.000Z',
        },
      ],
    });
    const residents = new ResidentRepositoryStub(resident);
    const service = new ResidentsService(residents);

    const updated = await service.updateResident(
      resident.id,
      buildResidentUpdateInput(resident, {
        email: 'marta.diaz@nuevo-mail.local',
        room: 'B-204',
      }),
      'coordinator-user',
      resident.organizationId,
    );

    expect(updated.email).toBe('marta.diaz@nuevo-mail.local');
    expect(updated.room).toBe('B-204');
    expect(updated.medicalHistory.map((entry) => entry.id)).toEqual(
      resident.medicalHistory.map((entry) => entry.id),
    );
    expect(updated.attachments.map((attachment) => attachment.id)).toEqual(
      resident.attachments.map((attachment) => attachment.id),
    );
    expect(updated.familyContacts.map((contact) => contact.id)).toEqual(
      resident.familyContacts.map((contact) => contact.id),
    );
    expect(residents.lastUpdatedResident?.medicalHistory).toEqual(
      resident.medicalHistory,
    );
    expect(residents.lastUpdatedResident?.attachments).toEqual(
      resident.attachments,
    );
    expect(residents.lastUpdatedResident?.familyContacts).toEqual(
      resident.familyContacts,
    );
  });
});

describe('ResidentsService.getResidentEvents', () => {
  it('returns resident events sorted by occurredAt descending', async () => {
    const resident = createResidentSeed();
    const residents = new ResidentRepositoryStub(resident);
    residents.seedEvents([
      createResidentEventSeed({
        id: 'resident-event-follow-up',
        residentId: resident.id,
        eventType: 'follow-up',
        title: 'Seguimiento cognitivo',
        occurredAt: '2026-03-12T18:00:00.000Z',
      }),
      createResidentEventSeed({
        id: 'resident-event-admission',
        residentId: resident.id,
        eventType: 'admission-note',
        title: 'Ingreso y evaluacion inicial',
        occurredAt: '2024-11-03T12:30:00.000Z',
      }),
      createResidentEventSeed({
        id: 'resident-event-history',
        residentId: resident.id,
        eventType: 'medical-history',
        title: 'Hipertension arterial',
        occurredAt: '2025-11-12T00:00:00.000Z',
      }),
    ]);
    const service = new ResidentsService(residents);

    const events = await service.getResidentEvents(
      resident.id,
      resident.organizationId,
    );

    expect(events.map((event) => event.id)).toEqual([
      'resident-event-follow-up',
      'resident-event-history',
      'resident-event-admission',
    ]);
  });
});

describe('ResidentsService.createResidentEvent', () => {
  it('creates a simple resident event without touching resident update contracts', async () => {
    const resident = createResidentSeed();
    const residents = new ResidentRepositoryStub(resident);
    const service = new ResidentsService(residents);

    const created = await service.createResidentEvent(
      resident.id,
      {
        eventType: 'follow-up',
        title: '  Cambio de rutina nocturna  ',
        description: '  Se observa mejor adherencia con acompanamiento.  ',
        occurredAt: '2026-03-25T21:00:00.000Z',
      },
      'coordinator-user',
      resident.organizationId,
    );

    expect(created.eventType).toBe('follow-up');
    expect(created.title).toBe('Cambio de rutina nocturna');
    expect(created.description).toBe(
      'Se observa mejor adherencia con acompanamiento.',
    );
    expect(created.actor).toBe('coordinator-user');
    expect(residents.lastCreatedEvent).toMatchObject({
      residentId: resident.id,
      organizationId: resident.organizationId,
      facilityId: resident.facilityId,
      eventType: 'follow-up',
      title: 'Cambio de rutina nocturna',
      description: 'Se observa mejor adherencia con acompanamiento.',
      occurredAt: '2026-03-25T21:00:00.000Z',
      actor: 'coordinator-user',
    });
    expect(residents.lastTouchedAudit).toEqual({
      residentId: resident.id,
      actor: 'coordinator-user',
      organizationId: resident.organizationId,
    });
  });

  it('rejects creating an event for a missing resident', async () => {
    const resident = createResidentSeed();
    const residents = new ResidentRepositoryStub(resident);
    const service = new ResidentsService(residents);

    await expect(
      service.createResidentEvent(
        'resident-missing',
        buildResidentEventInput(),
        'coordinator-user',
        resident.organizationId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects future event dates', async () => {
    const resident = createResidentSeed();
    const residents = new ResidentRepositoryStub(resident);
    const service = new ResidentsService(residents);

    await expect(
      service.createResidentEvent(
        resident.id,
        {
          ...buildResidentEventInput(),
          occurredAt: '2099-01-01T00:00:00.000Z',
        },
        'coordinator-user',
        resident.organizationId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function buildResidentUpdateInput(
  resident: Resident,
  overrides: Partial<ResidentUpdateInput> = {},
): ResidentUpdateInput {
  return {
    firstName: resident.firstName,
    middleNames: resident.middleNames,
    lastName: resident.lastName,
    otherLastNames: resident.otherLastNames,
    documentType: resident.documentType,
    documentNumber: resident.documentNumber,
    documentIssuingCountry: resident.documentIssuingCountry,
    procedureNumber: resident.procedureNumber,
    cuil: resident.cuil,
    birthDate: resident.birthDate,
    admissionDate: resident.admissionDate,
    sex: resident.sex,
    maritalStatus: resident.maritalStatus,
    nationality: resident.nationality,
    email: resident.email,
    room: resident.room,
    careLevel: resident.careLevel,
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

function buildResidentEventInput(
  overrides: Partial<ResidentEventCreateInput> = {},
): ResidentEventCreateInput {
  return {
    eventType: 'follow-up',
    title: 'Seguimiento simple',
    description: 'Se observa evolucion estable.',
    occurredAt: '2026-03-25T11:00:00.000Z',
    ...overrides,
  };
}

function createResidentEventSeed(
  overrides: Partial<ResidentEvent> = {},
): ResidentEvent {
  return {
    id: 'resident-event-seed',
    residentId: createResidentSeed().id,
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

function cloneResidentEvent(event: ResidentEvent): ResidentEvent {
  return {
    ...event,
    audit: { ...event.audit },
  };
}
