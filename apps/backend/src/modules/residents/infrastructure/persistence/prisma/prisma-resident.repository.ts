import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  Address,
  ContactPerson,
  EntityStatus,
  ResidentAttachment,
  ResidentBelongings,
  ResidentClinicalProfile,
  ResidentDischargeInfo,
  ResidentFamilyContact,
  ResidentInsuranceInfo,
  ResidentPsychiatricCareInfo,
  ResidentSex,
  ResidentTransferInfo,
} from '@gentrix/shared-types';
import {
  isResidentCareLevel,
  type Resident,
} from '@gentrix/domain-residents';
import { toIsoDateString } from '@gentrix/shared-utils';

import { PrismaService } from '../../../../../infrastructure/prisma/prisma.service';
import type { ResidentRepository } from '../../../domain/repositories/resident.repository';

type ResidentRecord = Prisma.ResidentGetPayload<{
  include: {
    clinicalEvents: true;
  };
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
const residentStatuses = new Set<EntityStatus>(['active', 'inactive', 'archived']);

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

  async findById(id: string, organizationId?: string): Promise<Resident | null> {
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
    belongings: fromJson<ResidentBelongings>(record.belongings, {
      glasses: false,
      dentures: false,
      walker: false,
      orthopedicBed: false,
    }),
    familyContacts: fromJson<ResidentFamilyContact[]>(record.familyContacts, []),
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
      deletedAt: record.deletedAt ? toIsoDateString(record.deletedAt) : undefined,
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

function normalizeResidentDocumentType(value: string | null): Resident['documentType'] {
  return residentDocumentTypes.has(value ?? '') ? (value as Resident['documentType']) : 'otro';
}

function normalizeResidentSex(value: string | null): ResidentSex {
  return residentSexes.has((value ?? 'x') as ResidentSex) ? ((value ?? 'x') as ResidentSex) : 'x';
}

function normalizeResidentStatus(value: string): EntityStatus {
  return residentStatuses.has(value as EntityStatus)
    ? (value as EntityStatus)
    : 'active';
}
