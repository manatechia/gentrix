import type {
  Address,
  AuditTrail,
  ContactPerson,
  EntityId,
  ResidentAttachment,
  ResidentAttachmentInput,
  ResidentAttachmentKind,
  ResidentDetail,
  ResidentDocumentType,
  ResidentMedicalHistoryEntry,
  ResidentMedicalHistoryEntryInput,
  ResidentSex,
  EntityStatus,
  IsoDateString,
  ResidentCreateInput,
  ResidentCareLevel,
} from '@gentrix/shared-types';
import {
  calculateAge,
  createEntityId,
  createRandomEntityId,
  toIsoDateString,
} from '@gentrix/shared-utils';

export type CareLevel = ResidentCareLevel;

export interface Resident {
  id: EntityId;
  firstName: string;
  middleNames?: string;
  lastName: string;
  otherLastNames?: string;
  documentType: ResidentDocumentType;
  documentNumber: string;
  documentIssuingCountry: string;
  birthDate: IsoDateString;
  admissionDate: IsoDateString;
  sex: ResidentSex;
  email?: string;
  room: string;
  careLevel: CareLevel;
  status: EntityStatus;
  medicalHistory: ResidentMedicalHistoryEntry[];
  attachments: ResidentAttachment[];
  address: Address;
  emergencyContact: ContactPerson;
  audit: AuditTrail;
}

export interface ResidentCard {
  id: EntityId;
  fullName: string;
  age: number;
  room: string;
  careLevel: CareLevel;
  status: EntityStatus;
}

const baseAddress: Address = {
  street: 'Av. Siempreviva 742',
  city: 'Buenos Aires',
  state: 'CABA',
  postalCode: 'C1405',
};

const baseContact: ContactPerson = {
  fullName: 'Laura Perez',
  relationship: 'Hija',
  phone: '+54 11 5555-0101',
};

const baseAudit: AuditTrail = {
  createdAt: toIsoDateString('2026-01-10T09:00:00.000Z'),
  updatedAt: toIsoDateString('2026-03-10T09:00:00.000Z'),
  createdBy: 'setup-script',
  updatedBy: 'setup-script',
};

export const residentCareLevels: CareLevel[] = [
  'independent',
  'assisted',
  'high-dependency',
  'memory-care',
];

export function isResidentCareLevel(value: unknown): value is CareLevel {
  return (
    typeof value === 'string' &&
    residentCareLevels.includes(value as CareLevel)
  );
}

function buildResidentFullName(resident: {
  firstName: string;
  middleNames?: string;
  lastName: string;
  otherLastNames?: string;
}): string {
  return [
    resident.firstName,
    resident.middleNames,
    resident.lastName,
    resident.otherLastNames,
  ]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join(' ');
}

function resolveResidentAttachmentKind(
  mimeType: string,
): ResidentAttachmentKind {
  return mimeType === 'application/pdf' ? 'pdf' : 'image';
}

function createMedicalHistoryEntry(
  input: ResidentMedicalHistoryEntryInput,
  createdAt: IsoDateString,
  idSeed: string,
): ResidentMedicalHistoryEntry {
  return {
    id: createEntityId('resident-history', idSeed),
    recordedAt: toIsoDateString(input.recordedAt),
    title: input.title.trim(),
    notes: input.notes.trim(),
    createdAt,
  };
}

function createResidentAttachment(
  input: ResidentAttachmentInput,
  uploadedAt: IsoDateString,
  idSeed: string,
): ResidentAttachment {
  return {
    id: createEntityId('resident-attachment', idSeed),
    fileName: input.fileName.trim(),
    mimeType: input.mimeType.trim(),
    sizeBytes: input.sizeBytes,
    dataUrl: input.dataUrl,
    kind: resolveResidentAttachmentKind(input.mimeType),
    uploadedAt,
  };
}

export function createResidentSeed(
  overrides: Partial<Resident> = {},
): Resident {
  const defaultMedicalHistory = [
    createMedicalHistoryEntry(
      {
        recordedAt: '2025-11-12T00:00:00.000Z',
        title: 'Hipertension arterial',
        notes:
          'Antecedente cronico controlado con seguimiento ambulatorio y medicacion diaria.',
      },
      baseAudit.createdAt,
      'Marta Diaz hipertension arterial',
    ),
  ];
  const residentBase: Resident = {
    id: createEntityId('resident', 'Marta Diaz A-101'),
    firstName: 'Marta',
    middleNames: '',
    lastName: 'Diaz',
    otherLastNames: '',
    documentType: 'dni',
    documentNumber: '30123456',
    documentIssuingCountry: 'Argentina',
    birthDate: toIsoDateString('1942-05-19T00:00:00.000Z'),
    admissionDate: toIsoDateString('2024-11-03T12:00:00.000Z'),
    sex: 'femenino',
    email: 'marta.diaz@sin-email.local',
    room: 'A-101',
    careLevel: 'assisted',
    status: 'active',
    medicalHistory: defaultMedicalHistory,
    attachments: [],
    address: { ...baseAddress, room: 'A-101' },
    emergencyContact: { ...baseContact },
    audit: { ...baseAudit },
    ...overrides,
  };

  const residentId =
    overrides.id ??
    createEntityId(
      'resident',
      `${buildResidentFullName(residentBase)} ${residentBase.documentNumber} ${residentBase.room}`,
    );

  return {
    ...residentBase,
    id: residentId,
    medicalHistory: (residentBase.medicalHistory ?? []).map((entry) => ({
      ...entry,
    })),
    attachments: (residentBase.attachments ?? []).map((attachment) => ({
      ...attachment,
    })),
    address: { ...baseAddress, room: residentBase.room, ...overrides.address },
    emergencyContact: { ...baseContact, ...overrides.emergencyContact },
    audit: { ...baseAudit, ...overrides.audit },
  };
}

export function createResidentFromIntake(
  input: ResidentCreateInput,
  referenceDate: Date = new Date(),
): Resident {
  const now = toIsoDateString(referenceDate);

  return createResidentSeed({
    id: createRandomEntityId(),
    firstName: input.firstName.trim(),
    middleNames: input.middleNames?.trim() || undefined,
    lastName: input.lastName.trim(),
    otherLastNames: input.otherLastNames?.trim() || undefined,
    documentType: input.documentType,
    documentNumber: input.documentNumber.trim(),
    documentIssuingCountry: input.documentIssuingCountry.trim(),
    birthDate: toIsoDateString(input.birthDate),
    admissionDate: now,
    sex: input.sex,
    email: input.email?.trim() || undefined,
    room: input.room.trim(),
    careLevel: input.careLevel,
    status: 'active',
    medicalHistory: input.medicalHistory.map((entry, index) =>
      ({
        id: createRandomEntityId(),
        recordedAt: toIsoDateString(entry.recordedAt),
        title: entry.title.trim(),
        notes: entry.notes.trim(),
        createdAt: now,
      }) satisfies ResidentMedicalHistoryEntry,
    ),
    attachments: input.attachments.map((attachment, index) =>
      ({
        id: createRandomEntityId(),
        fileName: attachment.fileName.trim(),
        mimeType: attachment.mimeType.trim(),
        sizeBytes: attachment.sizeBytes,
        dataUrl: attachment.dataUrl,
        kind: resolveResidentAttachmentKind(attachment.mimeType),
        uploadedAt: now,
      }) satisfies ResidentAttachment,
    ),
    emergencyContact: {
      fullName: 'Contacto pendiente',
      relationship: 'Pendiente',
      phone: 'Pendiente',
    },
    audit: {
      createdAt: now,
      updatedAt: now,
      createdBy: 'dashboard-intake',
      updatedBy: 'dashboard-intake',
    },
  });
}

export function toResidentCard(resident: Resident): ResidentCard {
  return {
    id: resident.id,
    fullName: buildResidentFullName(resident),
    age: calculateAge(resident.birthDate),
    room: resident.room,
    careLevel: resident.careLevel,
    status: resident.status,
  };
}

export function toResidentDetail(resident: Resident): ResidentDetail {
  return {
    id: resident.id,
    fullName: buildResidentFullName(resident),
    firstName: resident.firstName,
    middleNames: resident.middleNames,
    lastName: resident.lastName,
    otherLastNames: resident.otherLastNames,
    documentType: resident.documentType,
    documentNumber: resident.documentNumber,
    documentIssuingCountry: resident.documentIssuingCountry,
    age: calculateAge(resident.birthDate),
    birthDate: resident.birthDate,
    admissionDate: resident.admissionDate,
    sex: resident.sex,
    email: resident.email,
    room: resident.room,
    careLevel: resident.careLevel,
    status: resident.status,
    medicalHistory: resident.medicalHistory.map((entry) => ({ ...entry })),
    attachments: resident.attachments.map((attachment) => ({ ...attachment })),
    address: { ...resident.address },
    emergencyContact: { ...resident.emergencyContact },
    audit: { ...resident.audit },
  };
}
