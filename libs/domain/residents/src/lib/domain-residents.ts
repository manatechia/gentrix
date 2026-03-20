import type {
  Address,
  AuditTrail,
  ContactPerson,
  EntityId,
  ResidentAttachment,
  ResidentAttachmentInput,
  ResidentAttachmentKind,
  ResidentBelongings,
  ResidentClinicalProfile,
  ResidentDetail,
  ResidentDischargeInfo,
  ResidentDocumentType,
  ResidentFamilyContact,
  ResidentInsuranceInfo,
  ResidentMedicalHistoryEntry,
  ResidentMedicalHistoryEntryInput,
  ResidentPsychiatricCareInfo,
  ResidentSex,
  ResidentTransferInfo,
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
  internalNumber?: string;
  procedureNumber?: string;
  cuil?: string;
  birthDate: IsoDateString;
  admissionDate: IsoDateString;
  sex: ResidentSex;
  maritalStatus?: string;
  nationality?: string;
  email?: string;
  room: string;
  careLevel: CareLevel;
  status: EntityStatus;
  medicalHistory: ResidentMedicalHistoryEntry[];
  attachments: ResidentAttachment[];
  insurance: ResidentInsuranceInfo;
  transfer: ResidentTransferInfo;
  psychiatry: ResidentPsychiatricCareInfo;
  clinicalProfile: ResidentClinicalProfile;
  belongings: ResidentBelongings;
  familyContacts: ResidentFamilyContact[];
  discharge: ResidentDischargeInfo;
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

const baseInsurance: ResidentInsuranceInfo = {
  provider: 'PAMI',
  memberNumber: '4587-221904',
};

const baseTransfer: ResidentTransferInfo = {
  provider: 'SAME',
  address: 'Av. Directorio 1800, CABA',
  phone: '+54 11 4321-7788',
};

const basePsychiatry: ResidentPsychiatricCareInfo = {
  provider: 'Centro Amelia Salud Mental',
  careLocation: 'Consultorio externo',
  address: 'Av. Rivadavia 5200, CABA',
  phone: '+54 11 4567-8832',
};

const baseClinicalProfile: ResidentClinicalProfile = {
  allergies: 'Sin alergias medicamentosas informadas.',
  emergencyCareLocation: 'Hospital Durand',
  clinicalRecordNumber: 'HC-77541',
  primaryDoctorName: 'Dra. Lucia Mendez',
  primaryDoctorOfficeAddress: 'Av. Medrano 1120, CABA',
  primaryDoctorOfficePhone: '+54 11 4988-1200',
  pathologies: 'Hipertension arterial y deterioro cognitivo leve.',
  surgeries: 'Apendicectomia y reemplazo total de rodilla derecha.',
  smokes: false,
  drinksAlcohol: false,
  currentWeightKg: 62.4,
};

const baseBelongings: ResidentBelongings = {
  glasses: true,
  dentures: false,
  walker: false,
  orthopedicBed: false,
  notes: 'Ropa de cambio, album familiar y calzado ortopedico.',
};

const baseFamilyContacts: ResidentFamilyContact[] = [
  {
    id: createEntityId('resident-family-contact', 'Laura Perez Marta Diaz'),
    fullName: 'Laura Perez',
    relationship: 'Hija',
    phone: '+54 11 5555-0101',
    email: 'laura.perez@familia.local',
    address: 'Paysandu 1402, CABA',
    notes: 'Coordina tramites y acompanamiento en consultas.',
  },
];

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
    internalNumber: 'INT-001',
    procedureNumber: 'TRM-30123456',
    cuil: '27-30123456-3',
    birthDate: toIsoDateString('1942-05-19T00:00:00.000Z'),
    admissionDate: toIsoDateString('2024-11-03T12:00:00.000Z'),
    sex: 'femenino',
    maritalStatus: 'Viuda',
    nationality: 'Argentina',
    email: 'marta.diaz@sin-email.local',
    room: 'A-101',
    careLevel: 'assisted',
    status: 'active',
    medicalHistory: defaultMedicalHistory,
    attachments: [],
    insurance: { ...baseInsurance },
    transfer: { ...baseTransfer },
    psychiatry: { ...basePsychiatry },
    clinicalProfile: { ...baseClinicalProfile },
    belongings: { ...baseBelongings },
    familyContacts: baseFamilyContacts.map((contact) => ({ ...contact })),
    discharge: {},
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
    insurance: { ...baseInsurance, ...residentBase.insurance },
    transfer: { ...baseTransfer, ...residentBase.transfer },
    psychiatry: { ...basePsychiatry, ...residentBase.psychiatry },
    clinicalProfile: {
      ...baseClinicalProfile,
      ...residentBase.clinicalProfile,
    },
    belongings: { ...baseBelongings, ...residentBase.belongings },
    familyContacts: (residentBase.familyContacts ?? []).map((contact) => ({
      ...contact,
    })),
    discharge: { ...residentBase.discharge },
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
  const familyContacts = input.familyContacts.map((contact) =>
    ({
      id: createRandomEntityId(),
      fullName: contact.fullName.trim(),
      relationship: contact.relationship.trim(),
      phone: contact.phone.trim(),
      email: contact.email?.trim() || undefined,
      address: contact.address?.trim() || undefined,
      notes: contact.notes?.trim() || undefined,
    }) satisfies ResidentFamilyContact,
  );
  const primaryFamilyContact = familyContacts[0];

  return createResidentSeed({
    id: createRandomEntityId(),
    firstName: input.firstName.trim(),
    middleNames: input.middleNames?.trim() || undefined,
    lastName: input.lastName.trim(),
    otherLastNames: input.otherLastNames?.trim() || undefined,
    documentType: input.documentType,
    documentNumber: input.documentNumber.trim(),
    documentIssuingCountry: input.documentIssuingCountry.trim(),
    internalNumber: input.internalNumber?.trim() || undefined,
    procedureNumber: input.procedureNumber?.trim() || undefined,
    cuil: input.cuil?.trim() || undefined,
    birthDate: toIsoDateString(input.birthDate),
    admissionDate: toIsoDateString(input.admissionDate),
    sex: input.sex,
    maritalStatus: input.maritalStatus?.trim() || undefined,
    nationality: input.nationality?.trim() || undefined,
    email: input.email?.trim() || undefined,
    room: input.room.trim(),
    careLevel: input.careLevel,
    status: 'active',
    medicalHistory: input.medicalHistory.map((entry) =>
      ({
        id: createRandomEntityId(),
        recordedAt: toIsoDateString(entry.recordedAt),
        title: entry.title.trim(),
        notes: entry.notes.trim(),
        createdAt: now,
      }) satisfies ResidentMedicalHistoryEntry,
    ),
    attachments: input.attachments.map((attachment) =>
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
    insurance: {
      provider: input.insurance.provider?.trim() || undefined,
      memberNumber: input.insurance.memberNumber?.trim() || undefined,
    },
    transfer: {
      provider: input.transfer.provider?.trim() || undefined,
      address: input.transfer.address?.trim() || undefined,
      phone: input.transfer.phone?.trim() || undefined,
    },
    psychiatry: {
      provider: input.psychiatry.provider?.trim() || undefined,
      careLocation: input.psychiatry.careLocation?.trim() || undefined,
      address: input.psychiatry.address?.trim() || undefined,
      phone: input.psychiatry.phone?.trim() || undefined,
    },
    clinicalProfile: {
      allergies: input.clinicalProfile.allergies?.trim() || undefined,
      emergencyCareLocation:
        input.clinicalProfile.emergencyCareLocation?.trim() || undefined,
      clinicalRecordNumber:
        input.clinicalProfile.clinicalRecordNumber?.trim() || undefined,
      primaryDoctorName:
        input.clinicalProfile.primaryDoctorName?.trim() || undefined,
      primaryDoctorOfficeAddress:
        input.clinicalProfile.primaryDoctorOfficeAddress?.trim() || undefined,
      primaryDoctorOfficePhone:
        input.clinicalProfile.primaryDoctorOfficePhone?.trim() || undefined,
      pathologies: input.clinicalProfile.pathologies?.trim() || undefined,
      surgeries: input.clinicalProfile.surgeries?.trim() || undefined,
      smokes: input.clinicalProfile.smokes,
      drinksAlcohol: input.clinicalProfile.drinksAlcohol,
      currentWeightKg: input.clinicalProfile.currentWeightKg,
    },
    belongings: {
      glasses: input.belongings.glasses,
      dentures: input.belongings.dentures,
      walker: input.belongings.walker,
      orthopedicBed: input.belongings.orthopedicBed,
      notes: input.belongings.notes?.trim() || undefined,
    },
    familyContacts,
    discharge: {
      date: input.discharge.date
        ? toIsoDateString(input.discharge.date)
        : undefined,
      reason: input.discharge.reason?.trim() || undefined,
    },
    emergencyContact: {
      fullName: primaryFamilyContact?.fullName ?? 'Contacto pendiente',
      relationship: primaryFamilyContact?.relationship ?? 'Pendiente',
      phone: primaryFamilyContact?.phone ?? 'Pendiente',
      email: primaryFamilyContact?.email,
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
    internalNumber: resident.internalNumber,
    procedureNumber: resident.procedureNumber,
    cuil: resident.cuil,
    age: calculateAge(resident.birthDate),
    birthDate: resident.birthDate,
    admissionDate: resident.admissionDate,
    sex: resident.sex,
    maritalStatus: resident.maritalStatus,
    nationality: resident.nationality,
    email: resident.email,
    room: resident.room,
    careLevel: resident.careLevel,
    status: resident.status,
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
