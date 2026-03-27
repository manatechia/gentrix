import { describe, expect, it, vi } from 'vitest';

import {
  createResidentSeed,
  type Resident,
} from '@gentrix/domain-residents';
import type { ResidentEvent } from '@gentrix/shared-types';

import { PrismaResidentRepository } from './prisma-resident.repository';

describe('PrismaResidentRepository.update', () => {
  it('does not rewrite supporting snapshots or medical history during base updates', async () => {
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
    const updatedResident: Resident = {
      ...resident,
      email: 'marta.diaz@nuevo-mail.local',
      room: 'B-204',
      address: {
        ...resident.address,
        room: 'B-204',
      },
      audit: {
        ...resident.audit,
        updatedAt: '2026-03-26T21:00:00.000Z',
        updatedBy: 'coordinator-user',
      },
    };
    const residentUpdate = vi
      .fn()
      .mockResolvedValue(toResidentRecord(updatedResident));
    const prisma = {
      resident: {
        update: residentUpdate,
      },
    };
    const repository = new PrismaResidentRepository(prisma as never);

    const persistedResident = await repository.update(updatedResident);

    expect(residentUpdate).toHaveBeenCalledTimes(1);

    const [updateArgs] = residentUpdate.mock.calls[0];

    expect(updateArgs.where).toEqual({ id: resident.id });
    expect(updateArgs.data).toMatchObject({
      firstName: updatedResident.firstName,
      lastName: updatedResident.lastName,
      email: 'marta.diaz@nuevo-mail.local',
      room: 'B-204',
      careLevel: updatedResident.careLevel,
      status: updatedResident.status,
      address: updatedResident.address,
      updatedBy: 'coordinator-user',
    });
    expect(updateArgs.data).not.toHaveProperty('attachments');
    expect(updateArgs.data).not.toHaveProperty('familyContacts');
    expect(updateArgs.data).not.toHaveProperty('insurance');
    expect(updateArgs.data).not.toHaveProperty('clinicalEvents');

    expect(persistedResident.medicalHistory.map((entry) => entry.id)).toEqual(
      resident.medicalHistory.map((entry) => entry.id),
    );
    expect(persistedResident.attachments.map((attachment) => attachment.id)).toEqual(
      resident.attachments.map((attachment) => attachment.id),
    );
    expect(persistedResident.familyContacts.map((contact) => contact.id)).toEqual(
      resident.familyContacts.map((contact) => contact.id),
    );
  });
});

describe('PrismaResidentRepository.listEventsByResidentId', () => {
  it('requests all resident timeline events ordered by occurredAt descending', async () => {
    const resident = createResidentSeed();
    const findMany = vi.fn().mockResolvedValue([
      toClinicalHistoryEventRecord({
        id: 'resident-event-follow-up',
        residentId: resident.id,
        eventType: 'follow-up',
        title: 'Seguimiento cognitivo',
        description:
          'Se registra seguimiento neurologico con refuerzo de rutina nocturna y acompanamiento.',
        occurredAt: new Date('2026-03-12T18:00:00.000Z'),
      }),
      toClinicalHistoryEventRecord({
        id: 'resident-event-admission',
        residentId: resident.id,
        eventType: 'admission-note',
        title: 'Ingreso y evaluacion inicial',
        description:
          'Se registra ingreso con movilidad asistida y plan base de observacion diaria.',
        occurredAt: new Date('2024-11-03T12:30:00.000Z'),
      }),
    ]);
    const prisma = {
      clinicalHistoryEvent: {
        findMany,
      },
    };
    const repository = new PrismaResidentRepository(prisma as never);

    const events = await repository.listEventsByResidentId(
      resident.id,
      resident.organizationId,
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {
        residentId: resident.id,
        deletedAt: null,
        organizationId: resident.organizationId,
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });
    expect(events).toEqual<ResidentEvent[]>([
      {
        id: 'resident-event-follow-up',
        residentId: resident.id,
        eventType: 'follow-up',
        title: 'Seguimiento cognitivo',
        description:
          'Se registra seguimiento neurologico con refuerzo de rutina nocturna y acompanamiento.',
        occurredAt: '2026-03-12T18:00:00.000Z',
        actor: 'seed-script',
        audit: {
          createdAt: '2026-03-12T18:00:00.000Z',
          updatedAt: '2026-03-12T18:00:00.000Z',
          createdBy: 'seed-script',
          updatedBy: 'seed-script',
        },
      },
      {
        id: 'resident-event-admission',
        residentId: resident.id,
        eventType: 'admission-note',
        title: 'Ingreso y evaluacion inicial',
        description:
          'Se registra ingreso con movilidad asistida y plan base de observacion diaria.',
        occurredAt: '2024-11-03T12:30:00.000Z',
        actor: 'seed-script',
        audit: {
          createdAt: '2026-03-12T18:00:00.000Z',
          updatedAt: '2026-03-12T18:00:00.000Z',
          createdBy: 'seed-script',
          updatedBy: 'seed-script',
        },
      },
    ]);
  });
});

describe('PrismaResidentRepository.createEvent', () => {
  it('persists a resident event on top of ClinicalHistoryEvent', async () => {
    const resident = createResidentSeed();
    const createEvent = vi.fn().mockResolvedValue(
      toClinicalHistoryEventRecord({
        id: 'resident-event-created',
        residentId: resident.id,
        organizationId: resident.organizationId,
        facilityId: resident.facilityId,
        eventType: 'follow-up',
        title: 'Cambio de rutina nocturna',
        description: 'Se observa mejor adherencia con acompanamiento.',
        occurredAt: new Date('2026-03-25T21:00:00.000Z'),
        createdAt: new Date('2026-03-26T10:00:00.000Z'),
        updatedAt: new Date('2026-03-26T10:00:00.000Z'),
        createdBy: 'coordinator-user',
        updatedBy: 'coordinator-user',
      }),
    );
    const prisma = {
      clinicalHistoryEvent: {
        create: createEvent,
      },
    };
    const repository = new PrismaResidentRepository(prisma as never);

    const created = await repository.createEvent({
      residentId: resident.id,
      organizationId: resident.organizationId,
      facilityId: resident.facilityId,
      eventType: 'follow-up',
      title: 'Cambio de rutina nocturna',
      description: 'Se observa mejor adherencia con acompanamiento.',
      occurredAt: '2026-03-25T21:00:00.000Z',
      actor: 'coordinator-user',
      createdAt: '2026-03-26T10:00:00.000Z',
    });

    expect(createEvent).toHaveBeenCalledWith({
      data: {
        organizationId: resident.organizationId,
        facilityId: resident.facilityId,
        residentId: resident.id,
        eventType: 'follow-up',
        title: 'Cambio de rutina nocturna',
        description: 'Se observa mejor adherencia con acompanamiento.',
        occurredAt: new Date('2026-03-25T21:00:00.000Z'),
        createdAt: new Date('2026-03-26T10:00:00.000Z'),
        createdBy: 'coordinator-user',
        updatedAt: new Date('2026-03-26T10:00:00.000Z'),
        updatedBy: 'coordinator-user',
      },
    });
    expect(created).toMatchObject({
      id: 'resident-event-created',
      residentId: resident.id,
      eventType: 'follow-up',
      title: 'Cambio de rutina nocturna',
      description: 'Se observa mejor adherencia con acompanamiento.',
      occurredAt: '2026-03-25T21:00:00.000Z',
      actor: 'coordinator-user',
    });
  });
});

function toResidentRecord(resident: Resident) {
  return {
    id: resident.id,
    organizationId: resident.organizationId,
    facilityId: resident.facilityId,
    firstName: resident.firstName,
    middleNames: resident.middleNames ?? null,
    lastName: resident.lastName,
    otherLastNames: resident.otherLastNames ?? null,
    documentType: resident.documentType,
    documentNumber: resident.documentNumber,
    documentIssuingCountry: resident.documentIssuingCountry,
    internalNumber: resident.internalNumber ?? null,
    procedureNumber: resident.procedureNumber ?? null,
    cuil: resident.cuil ?? null,
    birthDate: new Date(resident.birthDate),
    admissionDate: new Date(resident.admissionDate),
    sex: resident.sex,
    maritalStatus: resident.maritalStatus ?? null,
    nationality: resident.nationality ?? null,
    email: resident.email ?? null,
    room: resident.room,
    careLevel: resident.careLevel,
    status: resident.status,
    attachments: resident.attachments,
    insurance: resident.insurance,
    transfer: resident.transfer,
    psychiatry: resident.psychiatry,
    clinicalProfile: resident.clinicalProfile,
    belongings: resident.belongings,
    familyContacts: resident.familyContacts,
    discharge: resident.discharge,
    address: resident.address,
    emergencyContact: resident.emergencyContact,
    createdAt: new Date(resident.audit.createdAt),
    createdBy: resident.audit.createdBy,
    updatedAt: new Date(resident.audit.updatedAt),
    updatedBy: resident.audit.updatedBy,
    deletedAt: resident.audit.deletedAt ? new Date(resident.audit.deletedAt) : null,
    deletedBy: resident.audit.deletedBy ?? null,
    clinicalEvents: resident.medicalHistory.map((entry) => ({
      id: entry.id,
      organizationId: resident.organizationId,
      facilityId: resident.facilityId,
      residentId: resident.id,
      eventType: 'medical-history',
      title: entry.title,
      description: entry.notes,
      occurredAt: new Date(entry.recordedAt),
      createdAt: new Date(entry.createdAt),
      createdBy: resident.audit.createdBy,
      updatedAt: new Date(resident.audit.updatedAt),
      updatedBy: resident.audit.updatedBy,
      deletedAt: null,
      deletedBy: null,
    })),
  };
}

function toClinicalHistoryEventRecord(
  overrides: Partial<{
    id: string;
    organizationId: string;
    facilityId: string | null;
    residentId: string;
    eventType: string;
    title: string;
    description: string;
    occurredAt: Date;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    deletedAt: Date | null;
    deletedBy: string | null;
  }> = {},
) {
  return {
    id: 'resident-event-default',
    organizationId: 'organization-gentrix-demo',
    facilityId: 'facility-residencia-central',
    residentId: 'resident-marta-diaz-a-101',
    eventType: 'follow-up',
    title: 'Seguimiento simple',
    description: 'Se observa evolucion estable.',
    occurredAt: new Date('2026-03-25T11:00:00.000Z'),
    createdAt: new Date('2026-03-12T18:00:00.000Z'),
    createdBy: 'seed-script',
    updatedAt: new Date('2026-03-12T18:00:00.000Z'),
    updatedBy: 'seed-script',
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}
