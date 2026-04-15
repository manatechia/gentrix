import { Inject, Injectable } from '@nestjs/common';
import {
  Prisma,
  type ClinicalHistoryEvent,
  type ResidentObservation as PrismaResidentObservation,
  type ResidentObservationEntry as PrismaResidentObservationEntry,
} from '@prisma/client';

import type {
  Address,
  ContactPerson,
  EntityStatus,
  ResidentAttachment,
  ResidentBelongings,
  ResidentCareStatus,
  ResidentClinicalProfile,
  ResidentDischargeInfo,
  ResidentEvent,
  ResidentGeriatricAssessment,
  ResidentObservation,
  ResidentObservationEntry,
  ResidentFamilyContact,
  ResidentInsuranceInfo,
  ResidentPsychiatricCareInfo,
  ResidentSex,
  ResidentTransferInfo,
} from '@gentrix/shared-types';
import { isResidentCareLevel, type Resident } from '@gentrix/domain-residents';

import { isResidentCareStatus } from '../../../domain/policies/care-status.policy';
import { toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type {
  ResidentCareStatusUpdateRecordInput,
  ResidentEventRecordInput,
  ResidentObservationEntryRecordInput,
  ResidentObservationRecordInput,
  ResidentObservationResolveRecordInput,
  ResidentRepository,
} from '../../../domain/repositories/resident.repository';

type ResidentRecord = Prisma.ResidentGetPayload<{
  include: {
    clinicalEvents: true;
  };
}>;
const residentObservationInclude = {
  entries: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
  },
} satisfies Prisma.ResidentObservationInclude;

type ResidentObservationRecord = Prisma.ResidentObservationGetPayload<{
  include: typeof residentObservationInclude;
}>;
const residentMedicalHistoryEventType = 'medical-history';

const residentDocumentTypes = new Set([
  'dni',
  'pasaporte',
  'cedula',
  'libreta-civica',
  'otro',
]);

const residentSexes = new Set<ResidentSex>(['femenino', 'masculino', 'x']);
const residentStatuses = new Set<EntityStatus>([
  'active',
  'inactive',
  'archived',
]);

@Injectable()
export class PrismaResidentRepository implements ResidentRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async list(organizationId?: string): Promise<Resident[]> {
    const residents = await this.prisma.resident.findMany({
      where: {
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      include: {
        clinicalEvents: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            occurredAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return residents.map(mapResidentRecord);
  }

  async findById(
    id: string,
    organizationId?: string,
  ): Promise<Resident | null> {
    const resident = await this.prisma.resident.findFirst({
      where: {
        id,
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      include: {
        clinicalEvents: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            occurredAt: 'desc',
          },
        },
      },
    });

    return resident ? mapResidentRecord(resident) : null;
  }

  async create(resident: Resident): Promise<Resident> {
    const created = await this.prisma.resident.create({
      data: {
        id: resident.id,
        organizationId: resident.organizationId,
        facilityId: resident.facilityId,
        internalNumber: resident.internalNumber,
        status: resident.status,
        careStatus: resident.careStatus,
        careStatusChangedAt: resident.careStatusChangedAt
          ? new Date(resident.careStatusChangedAt)
          : null,
        careStatusChangedBy: resident.careStatusChangedBy ?? null,
        ...toResidentPersistenceData(resident),
        createdAt: new Date(resident.audit.createdAt),
        createdBy: resident.audit.createdBy,
        updatedAt: new Date(resident.audit.updatedAt),
        updatedBy: resident.audit.updatedBy,
        deletedAt: resident.audit.deletedAt
          ? new Date(resident.audit.deletedAt)
          : null,
        deletedBy: resident.audit.deletedBy ?? null,
        clinicalEvents: resident.medicalHistory.length
          ? {
              create: toMedicalHistoryEventRecords(resident),
            }
          : undefined,
      },
      include: {
        clinicalEvents: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            occurredAt: 'desc',
          },
        },
      },
    });

    return mapResidentRecord(created);
  }

  async update(resident: Resident): Promise<Resident> {
    const persistedResident = await this.prisma.resident.update({
      where: {
        id: resident.id,
      },
      data: {
        ...toResidentBaseUpdatePersistenceData(resident),
        updatedAt: new Date(resident.audit.updatedAt),
        updatedBy: resident.audit.updatedBy,
        deletedAt: resident.audit.deletedAt
          ? new Date(resident.audit.deletedAt)
          : null,
        deletedBy: resident.audit.deletedBy ?? null,
      },
      include: {
        clinicalEvents: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            occurredAt: 'desc',
          },
        },
      },
    });

    return mapResidentRecord(persistedResident);
  }

  async touchAudit(
    residentId: Resident['id'],
    actor: string,
    organizationId?: Resident['organizationId'],
  ): Promise<void> {
    await this.prisma.resident.updateMany({
      where: {
        id: residentId,
        organizationId: organizationId ?? undefined,
        deletedAt: null,
      },
      data: {
        updatedAt: new Date(),
        updatedBy: actor,
      },
    });
  }

  async listEvents(
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentEvent[]> {
    const events = await this.prisma.clinicalHistoryEvent.findMany({
      where: {
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    return events.map(mapResidentEventRecord);
  }

  async listEventsByResidentId(
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentEvent[]> {
    const events = await this.prisma.clinicalHistoryEvent.findMany({
      where: {
        residentId,
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });

    return events.map(mapResidentEventRecord);
  }

  async createEvent(event: ResidentEventRecordInput): Promise<ResidentEvent> {
    const created = await this.prisma.clinicalHistoryEvent.create({
      data: {
        organizationId: event.organizationId,
        facilityId: event.facilityId ?? null,
        residentId: event.residentId,
        eventType: event.eventType,
        title: event.title,
        description: event.description,
        occurredAt: new Date(event.occurredAt),
        createdAt: new Date(event.createdAt),
        createdBy: event.actor,
        updatedAt: new Date(event.createdAt),
        updatedBy: event.actor,
      },
    });

    return mapResidentEventRecord(created);
  }

  async listObservations(
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation[]> {
    const observations = await this.prisma.residentObservation.findMany({
      where: {
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      include: residentObservationInclude,
      orderBy: [{ openedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return observations.map(mapResidentObservationRecord);
  }

  async listObservationsByResidentId(
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation[]> {
    const observations = await this.prisma.residentObservation.findMany({
      where: {
        residentId,
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      include: residentObservationInclude,
      orderBy: [{ openedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return observations.map(mapResidentObservationRecord);
  }

  async findObservationById(
    observationId: ResidentObservation['id'],
    residentId: Resident['id'],
    organizationId?: Resident['organizationId'],
  ): Promise<ResidentObservation | null> {
    const observation = await this.prisma.residentObservation.findFirst({
      where: {
        id: observationId,
        residentId,
        deletedAt: null,
        organizationId: organizationId ?? undefined,
      },
      include: residentObservationInclude,
    });

    return observation ? mapResidentObservationRecord(observation) : null;
  }

  async createObservation(
    observation: ResidentObservationRecordInput,
  ): Promise<ResidentObservation> {
    const created = await this.prisma.residentObservation.create({
      data: {
        organizationId: observation.organizationId,
        residentId: observation.residentId,
        status: 'active',
        severity: observation.severity,
        title: observation.title,
        description: observation.description,
        openedAt: new Date(observation.openedAt),
        openedBy: observation.actor,
        createdAt: new Date(observation.openedAt),
        createdBy: observation.actor,
        updatedAt: new Date(observation.openedAt),
        updatedBy: observation.actor,
      },
      include: residentObservationInclude,
    });

    return mapResidentObservationRecord(created);
  }

  async createObservationEntry(
    entry: ResidentObservationEntryRecordInput,
  ): Promise<ResidentObservation> {
    const updated = await this.prisma.residentObservation.update({
      where: {
        id: entry.observationId,
      },
      data: {
        updatedAt: new Date(entry.occurredAt),
        updatedBy: entry.actor,
        entries: {
          create: {
            organizationId: entry.organizationId,
            residentId: entry.residentId,
            entryType: entry.entryType,
            title: entry.title,
            description: entry.description,
            occurredAt: new Date(entry.occurredAt),
            createdAt: new Date(entry.occurredAt),
            createdBy: entry.actor,
            updatedAt: new Date(entry.occurredAt),
            updatedBy: entry.actor,
          },
        },
      },
      include: residentObservationInclude,
    });

    return mapResidentObservationRecord(updated);
  }

  async setCareStatus(
    input: ResidentCareStatusUpdateRecordInput,
  ): Promise<Resident> {
    const changedAt = new Date(input.changedAt);
    const updated = await this.prisma.resident.update({
      where: { id: input.residentId },
      data: {
        careStatus: input.toStatus,
        careStatusChangedAt: changedAt,
        careStatusChangedBy: input.actor,
        // Convención del módulo: cambio de estado clínico también refresca
        // updatedAt/updatedBy del residente — la auditoría dedicada quedó como
        // deuda técnica (ver docs/tech-debt/resident-care-status-audit.md).
        updatedAt: changedAt,
        updatedBy: input.actor,
      },
      include: {
        clinicalEvents: {
          where: { deletedAt: null },
          orderBy: { occurredAt: 'desc' },
        },
      },
    });

    return mapResidentRecord(updated);
  }

  async resolveObservation(
    resolution: ResidentObservationResolveRecordInput,
  ): Promise<ResidentObservation> {
    const updated = await this.prisma.residentObservation.update({
      where: {
        id: resolution.observationId,
      },
      data: {
        status: 'resolved',
        resolvedAt: new Date(resolution.resolvedAt),
        resolvedBy: resolution.actor,
        resolutionType: resolution.resolutionType,
        resolutionSummary: resolution.summary,
        updatedAt: new Date(resolution.resolvedAt),
        updatedBy: resolution.actor,
        entries: {
          create: {
            organizationId: resolution.organizationId,
            residentId: resolution.residentId,
            entryType: 'resolution',
            title: buildResolutionTitle(resolution.resolutionType),
            description: resolution.summary,
            occurredAt: new Date(resolution.resolvedAt),
            createdAt: new Date(resolution.resolvedAt),
            createdBy: resolution.actor,
            updatedAt: new Date(resolution.resolvedAt),
            updatedBy: resolution.actor,
          },
        },
      },
      include: residentObservationInclude,
    });

    return mapResidentObservationRecord(updated);
  }
}

function mapResidentRecord(record: ResidentRecord): Resident {
  const address = fromJson<Address>(record.address, {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    room: record.room,
  });
  const emergencyContact = fromJson<ContactPerson>(record.emergencyContact, {
    fullName: 'Contacto pendiente',
    relationship: 'Pendiente',
    phone: 'Pendiente',
  });
  const medicalHistoryEvents = record.clinicalEvents.filter(
    (event) => event.eventType === residentMedicalHistoryEventType,
  );

  return {
    id: record.id as Resident['id'],
    organizationId: record.organizationId as Resident['organizationId'],
    facilityId: record.facilityId as Resident['facilityId'],
    firstName: record.firstName,
    middleNames: record.middleNames ?? undefined,
    lastName: record.lastName,
    otherLastNames: record.otherLastNames ?? undefined,
    documentType: normalizeResidentDocumentType(record.documentType),
    documentNumber: record.documentNumber ?? record.id,
    documentIssuingCountry: record.documentIssuingCountry ?? 'Argentina',
    internalNumber: record.internalNumber ?? undefined,
    procedureNumber: record.procedureNumber ?? undefined,
    cuil: record.cuil ?? undefined,
    birthDate: toIsoDateString(record.birthDate),
    admissionDate: toIsoDateString(record.admissionDate),
    sex: normalizeResidentSex(record.sex),
    maritalStatus: record.maritalStatus ?? undefined,
    nationality: record.nationality ?? undefined,
    email: record.email ?? undefined,
    room: record.room,
    careLevel: isResidentCareLevel(record.careLevel)
      ? record.careLevel
      : 'assisted',
    status: normalizeResidentStatus(record.status),
    careStatus: normalizeResidentCareStatus(record.careStatus),
    careStatusChangedAt: record.careStatusChangedAt
      ? toIsoDateString(record.careStatusChangedAt)
      : undefined,
    careStatusChangedBy: record.careStatusChangedBy ?? undefined,
    medicalHistory: medicalHistoryEvents.map((event) => ({
      id: event.id as Resident['medicalHistory'][number]['id'],
      recordedAt: toIsoDateString(event.occurredAt),
      title: event.title,
      notes: event.description,
      createdAt: toIsoDateString(event.createdAt),
    })),
    attachments: fromJson<ResidentAttachment[]>(record.attachments, []),
    insurance: fromJson<ResidentInsuranceInfo>(record.insurance, {}),
    transfer: fromJson<ResidentTransferInfo>(record.transfer, {}),
    psychiatry: fromJson<ResidentPsychiatricCareInfo>(record.psychiatry, {}),
    clinicalProfile: fromJson<ResidentClinicalProfile>(
      record.clinicalProfile,
      {},
    ),
    geriatricAssessment: fromJson<ResidentGeriatricAssessment>(
      record.geriatricAssessment,
      {},
    ),
    belongings: fromJson<ResidentBelongings>(record.belongings, {
      glasses: false,
      dentures: false,
      walker: false,
      orthopedicBed: false,
    }),
    familyContacts: fromJson<ResidentFamilyContact[]>(
      record.familyContacts,
      [],
    ),
    discharge: fromJson<ResidentDischargeInfo>(record.discharge, {}),
    address: {
      ...address,
      room: address.room ?? record.room,
    },
    emergencyContact,
    audit: {
      createdAt: toIsoDateString(record.createdAt),
      updatedAt: toIsoDateString(record.updatedAt),
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      deletedAt: record.deletedAt
        ? toIsoDateString(record.deletedAt)
        : undefined,
      deletedBy: record.deletedBy ?? undefined,
    },
  };
}

function mapResidentEventRecord(record: ClinicalHistoryEvent): ResidentEvent {
  return {
    id: record.id as ResidentEvent['id'],
    residentId: record.residentId as ResidentEvent['residentId'],
    eventType: record.eventType as ResidentEvent['eventType'],
    title: record.title,
    description: record.description,
    occurredAt: toIsoDateString(record.occurredAt),
    actor: record.createdBy,
    audit: {
      createdAt: toIsoDateString(record.createdAt),
      updatedAt: toIsoDateString(record.updatedAt),
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      deletedAt: record.deletedAt
        ? toIsoDateString(record.deletedAt)
        : undefined,
      deletedBy: record.deletedBy ?? undefined,
    },
  };
}

function mapResidentObservationRecord(
  record: ResidentObservationRecord,
): ResidentObservation {
  return {
    id: record.id as ResidentObservation['id'],
    residentId: record.residentId as ResidentObservation['residentId'],
    status: record.status as ResidentObservation['status'],
    severity: record.severity as ResidentObservation['severity'],
    title: record.title,
    description: record.description,
    openedAt: toIsoDateString(record.openedAt),
    openedBy: record.openedBy,
    resolvedAt: record.resolvedAt
      ? toIsoDateString(record.resolvedAt)
      : undefined,
    resolvedBy: record.resolvedBy ?? undefined,
    resolutionType:
      (record.resolutionType as ResidentObservation['resolutionType']) ??
      undefined,
    resolutionSummary: record.resolutionSummary ?? undefined,
    entries: record.entries.map(mapResidentObservationEntryRecord),
    audit: {
      createdAt: toIsoDateString(record.createdAt),
      updatedAt: toIsoDateString(record.updatedAt),
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      deletedAt: record.deletedAt
        ? toIsoDateString(record.deletedAt)
        : undefined,
      deletedBy: record.deletedBy ?? undefined,
    },
  };
}

function mapResidentObservationEntryRecord(
  record: PrismaResidentObservationEntry,
): ResidentObservationEntry {
  return {
    id: record.id as ResidentObservationEntry['id'],
    observationId: record.observationId as ResidentObservationEntry['observationId'],
    residentId: record.residentId as ResidentObservationEntry['residentId'],
    entryType: record.entryType as ResidentObservationEntry['entryType'],
    title: record.title,
    description: record.description,
    occurredAt: toIsoDateString(record.occurredAt),
    actor: record.createdBy,
    audit: {
      createdAt: toIsoDateString(record.createdAt),
      updatedAt: toIsoDateString(record.updatedAt),
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      deletedAt: record.deletedAt
        ? toIsoDateString(record.deletedAt)
        : undefined,
      deletedBy: record.deletedBy ?? undefined,
    },
  };
}

function fromJson<T>(value: Prisma.JsonValue | null, fallback: T): T {
  return value == null ? fallback : (value as T);
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toResidentPersistenceData(resident: Resident) {
  return {
    organizationId: resident.organizationId,
    facilityId: resident.facilityId,
    firstName: resident.firstName,
    middleNames: resident.middleNames,
    lastName: resident.lastName,
    otherLastNames: resident.otherLastNames,
    documentType: resident.documentType,
    documentNumber: resident.documentNumber,
    documentIssuingCountry: resident.documentIssuingCountry,
    procedureNumber: resident.procedureNumber,
    cuil: resident.cuil,
    birthDate: new Date(resident.birthDate),
    admissionDate: new Date(resident.admissionDate),
    sex: resident.sex,
    maritalStatus: resident.maritalStatus,
    nationality: resident.nationality,
    email: resident.email,
    room: resident.room,
    careLevel: resident.careLevel,
    attachments: toJsonInput(resident.attachments),
    insurance: toJsonInput(resident.insurance),
    transfer: toJsonInput(resident.transfer),
    psychiatry: toJsonInput(resident.psychiatry),
    clinicalProfile: toJsonInput(resident.clinicalProfile),
    geriatricAssessment: toJsonInput(resident.geriatricAssessment),
    belongings: toJsonInput(resident.belongings),
    familyContacts: toJsonInput(resident.familyContacts),
    discharge: toJsonInput(resident.discharge),
    address: toJsonInput(resident.address),
    emergencyContact: toJsonInput(resident.emergencyContact),
  };
}

function toResidentBaseUpdatePersistenceData(resident: Resident) {
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
    birthDate: new Date(resident.birthDate),
    admissionDate: new Date(resident.admissionDate),
    sex: resident.sex,
    maritalStatus: resident.maritalStatus,
    nationality: resident.nationality,
    email: resident.email,
    room: resident.room,
    careLevel: resident.careLevel,
    geriatricAssessment: toJsonInput(resident.geriatricAssessment),
    status: resident.status,
    address: toJsonInput(resident.address),
  };
}

function toMedicalHistoryEventRecords(resident: Resident) {
  return resident.medicalHistory.map((entry) => ({
    id: entry.id,
    organizationId: resident.organizationId,
    facilityId: resident.facilityId,
    eventType: residentMedicalHistoryEventType,
    title: entry.title,
    description: entry.notes,
    occurredAt: new Date(entry.recordedAt),
    createdAt: new Date(entry.createdAt),
    createdBy: resident.audit.updatedBy,
    updatedAt: new Date(resident.audit.updatedAt),
    updatedBy: resident.audit.updatedBy,
  }));
}

function normalizeResidentDocumentType(
  value: string | null,
): Resident['documentType'] {
  return residentDocumentTypes.has(value ?? '')
    ? (value as Resident['documentType'])
    : 'otro';
}

function normalizeResidentSex(value: string | null): ResidentSex {
  return residentSexes.has((value ?? 'x') as ResidentSex)
    ? ((value ?? 'x') as ResidentSex)
    : 'x';
}

function normalizeResidentStatus(value: string): EntityStatus {
  return residentStatuses.has(value as EntityStatus)
    ? (value as EntityStatus)
    : 'active';
}

function normalizeResidentCareStatus(value: string): ResidentCareStatus {
  // Si en el futuro alguien escribe a mano un valor inválido en la BD,
  // degradamos silenciosamente a 'normal' en vez de romper toda la lectura.
  return isResidentCareStatus(value) ? value : 'normal';
}

function buildResolutionTitle(
  resolutionType: ResidentObservation['resolutionType'],
): string {
  switch (resolutionType) {
    case 'medical-visit':
      return 'Derivacion medica';
    case 'phone-call':
      return 'Llamado realizado';
    default:
      return 'Observacion cerrada';
  }
}
