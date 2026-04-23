import type {
  Address,
  AuditTrail,
  ContactPerson,
  EntityId,
  EntityStatus,
  IsoDateString,
  ResidentAttachment,
  ResidentAttachmentKind,
  ResidentBaseProfile,
  ResidentBelongings,
  ResidentCareLevel,
  ResidentCareStatus,
  ResidentClinicalProfile,
  ResidentCreateInput,
  ResidentCurrentState,
  ResidentDetail,
  ResidentFamilyContact,
  ResidentGeriatricAssessment,
  ResidentGeriatricAssessmentLevel,
  ResidentInsuranceInfo,
  ResidentMedicalHistoryEntry,
  ResidentMedicalHistoryEntryInput,
  ResidentPsychiatricCareInfo,
  ResidentSupportingRecordSnapshot,
  ResidentTransferInfo,
  ResidentUpdateInput,
} from '@gentrix/shared-types';
import {
  calculateAge,
  createEntityId,
  createRandomEntityId,
  toIsoDateString,
} from '@gentrix/shared-utils';

export type CareLevel = ResidentCareLevel;

export interface Resident
  extends ResidentBaseProfile,
    ResidentCurrentState,
    ResidentSupportingRecordSnapshot {
  id: EntityId;
  organizationId: EntityId;
  facilityId: EntityId;
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
  careStatus: ResidentCareStatus;
  careStatusChangedAt?: IsoDateString;
  careStatusChangedBy?: string;
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

const baseGeriatricAssessment: ResidentGeriatricAssessment = {
  cognition: 'monitored',
  mobility: 'monitored',
  feeding: 'preserved',
  skinIntegrity: 'preserved',
  dependencyLevel: 'monitored',
  mood: 'preserved',
  supportEquipment: 'Anteojos y ayuda puntual para traslados largos.',
  notes: 'Valoracion inicial de ingreso con foco en autonomia y seguimiento diario.',
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

const defaultOrganizationId = createEntityId('organization', 'gentrix demo');
const defaultFacilityId = createEntityId('facility', 'residencia central');

export const residentCareLevels: CareLevel[] = [
  'independent',
  'assisted',
  'high-dependency',
  'memory-care',
];

export const residentGeriatricAssessmentLevels: ResidentGeriatricAssessmentLevel[] =
  ['preserved', 'monitored', 'high-support'];

export function isResidentCareLevel(value: unknown): value is CareLevel {
  return (
    typeof value === 'string' &&
    residentCareLevels.includes(value as CareLevel)
  );
}

export function isResidentGeriatricAssessmentLevel(
  value: unknown,
): value is ResidentGeriatricAssessmentLevel {
  return (
    typeof value === 'string' &&
    residentGeriatricAssessmentLevels.includes(
      value as ResidentGeriatricAssessmentLevel,
    )
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
  actor: string = 'setup-script',
): ResidentMedicalHistoryEntry {
  return {
    id: createEntityId('resident-history', idSeed),
    recordedAt: toIsoDateString(input.recordedAt),
    title: input.title.trim(),
    notes: input.notes.trim(),
    createdAt,
    updatedAt: createdAt,
    createdBy: actor,
    updatedBy: actor,
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
    organizationId: defaultOrganizationId,
    facilityId: defaultFacilityId,
    firstName: 'Marta',
    middleNames: '',
    lastName: 'Diaz',
    otherLastNames: '',
    documentType: 'dni',
    documentNumber: '30123456',
    documentIssuingCountry: 'Argentina',
    internalNumber: createEntityId(
      'resident-internal',
      'Marta Diaz 30123456 A-101',
    ),
    procedureNumber: 'TRM-30123456',
    cuil: '27-30123456-3',
    birthDate: toIsoDateString('1942-05-19T00:00:00.000Z'),
    admissionDate: toIsoDateString('2024-11-03T12:00:00.000Z'),
    sex: 'femenino',
    maritalStatus: 'widowed',
    nationality: 'Argentina',
    email: 'marta.diaz@sin-email.local',
    room: 'A-101',
    careLevel: 'assisted',
    status: 'active',
    careStatus: 'normal',
    medicalHistory: defaultMedicalHistory,
    attachments: [],
    insurance: { ...baseInsurance },
    transfer: { ...baseTransfer },
    psychiatry: { ...basePsychiatry },
    clinicalProfile: { ...baseClinicalProfile },
    geriatricAssessment: { ...baseGeriatricAssessment },
    belongings: { ...baseBelongings },
    familyContacts: baseFamilyContacts.map((contact) => ({ ...contact })),
    discharge: {},
    address: { ...baseAddress },
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
    geriatricAssessment: {
      ...baseGeriatricAssessment,
      ...residentBase.geriatricAssessment,
    },
    belongings: { ...baseBelongings, ...residentBase.belongings },
    familyContacts: (residentBase.familyContacts ?? []).map((contact) => ({
      ...contact,
    })),
    discharge: { ...residentBase.discharge },
    address: { ...baseAddress, ...overrides.address },
    emergencyContact: { ...baseContact, ...overrides.emergencyContact },
    audit: { ...baseAudit, ...overrides.audit },
  };
}

export function createResidentFromIntake(
  input: ResidentCreateInput,
  organizationId: Resident['organizationId'],
  facilityId: Resident['facilityId'],
  referenceDate: Date = new Date(),
): Resident {
  const now = toIsoDateString(referenceDate);
  const editableFields = mapResidentCreateInput(input, now);

  return createResidentSeed({
    id: createRandomEntityId(),
    internalNumber: createRandomEntityId(),
    organizationId,
    facilityId,
    status: 'active',
    careStatus: 'normal',
    ...editableFields,
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
    },
    emergencyContact: buildEmergencyContact(editableFields.familyContacts),
    audit: {
      createdAt: now,
      updatedAt: now,
      createdBy: 'dashboard-intake',
      updatedBy: 'dashboard-intake',
    },
  });
}

export function updateResidentBaseProfile(
  currentResident: Resident,
  input: ResidentUpdateInput,
  actor: string,
  referenceDate: Date = new Date(),
): Resident {
  const now = toIsoDateString(referenceDate);
  const editableFields = mapResidentUpdateInput(input);

  return {
    ...currentResident,
    ...editableFields,
    address: {
      ...currentResident.address,
    },
    audit: {
      ...currentResident.audit,
      updatedAt: now,
      updatedBy: actor,
    },
  };
}

export function toResidentCard(resident: Resident): ResidentCard {
  return {
    id: resident.id,
    fullName: buildResidentFullName(resident),
    age: calculateAge(resident.birthDate),
    room: resident.room,
    careLevel: resident.careLevel,
    status: resident.status,
    careStatus: resident.careStatus,
    careStatusChangedAt: resident.careStatusChangedAt,
    careStatusChangedBy: resident.careStatusChangedBy,
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
    careStatus: resident.careStatus,
    careStatusChangedAt: resident.careStatusChangedAt,
    careStatusChangedBy: resident.careStatusChangedBy,
    medicalHistory: resident.medicalHistory.map((entry) => ({ ...entry })),
    attachments: resident.attachments.map((attachment) => ({ ...attachment })),
    insurance: { ...resident.insurance },
    transfer: { ...resident.transfer },
    psychiatry: { ...resident.psychiatry },
    clinicalProfile: { ...resident.clinicalProfile },
    geriatricAssessment: { ...resident.geriatricAssessment },
    belongings: { ...resident.belongings },
    familyContacts: resident.familyContacts.map((contact) => ({ ...contact })),
    discharge: { ...resident.discharge },
    address: { ...resident.address },
    emergencyContact: { ...resident.emergencyContact },
    audit: { ...resident.audit },
  };
}

type ResidentStableProfileFields = Pick<
  Resident,
  | 'firstName'
  | 'middleNames'
  | 'lastName'
  | 'otherLastNames'
  | 'documentType'
  | 'documentNumber'
  | 'documentIssuingCountry'
  | 'procedureNumber'
  | 'cuil'
  | 'birthDate'
  | 'admissionDate'
  | 'sex'
  | 'maritalStatus'
  | 'nationality'
  | 'email'
>;

type ResidentCurrentStateFields = Pick<Resident, 'room' | 'careLevel'>;

type ResidentSupportingIntakeFields = Pick<
  Resident,
  | 'medicalHistory'
  | 'attachments'
  | 'insurance'
  | 'transfer'
  | 'psychiatry'
  | 'clinicalProfile'
  | 'geriatricAssessment'
  | 'belongings'
  | 'familyContacts'
  | 'discharge'
>;

type ResidentEditableIntakeFields = ResidentStableProfileFields &
  ResidentCurrentStateFields &
  ResidentSupportingIntakeFields;

type ResidentEditableBaseUpdateFields = ResidentStableProfileFields &
  ResidentCurrentStateFields & {
    geriatricAssessment: ResidentGeriatricAssessment;
  };

function mapResidentCreateInput(
  input: ResidentCreateInput,
  now: IsoDateString,
): ResidentEditableIntakeFields {
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

  return {
    firstName: input.firstName.trim(),
    middleNames: input.middleNames?.trim() || undefined,
    lastName: input.lastName.trim(),
    otherLastNames: input.otherLastNames?.trim() || undefined,
    documentType: input.documentType,
    documentNumber: input.documentNumber.trim(),
    documentIssuingCountry: input.documentIssuingCountry.trim(),
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
    medicalHistory: input.medicalHistory.map((entry) =>
      ({
        id: createRandomEntityId(),
        recordedAt: toIsoDateString(entry.recordedAt),
        title: entry.title.trim(),
        notes: entry.notes.trim(),
        createdAt: now,
        updatedAt: now,
        createdBy: 'dashboard-intake',
        updatedBy: 'dashboard-intake',
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
    geriatricAssessment: {
      cognition: input.geriatricAssessment.cognition,
      mobility: input.geriatricAssessment.mobility,
      feeding: input.geriatricAssessment.feeding,
      skinIntegrity: input.geriatricAssessment.skinIntegrity,
      dependencyLevel: input.geriatricAssessment.dependencyLevel,
      mood: input.geriatricAssessment.mood,
      supportEquipment:
        input.geriatricAssessment.supportEquipment?.trim() || undefined,
      notes: input.geriatricAssessment.notes?.trim() || undefined,
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
  };
}

function mapResidentUpdateInput(
  input: ResidentUpdateInput,
): ResidentEditableBaseUpdateFields {
  return {
    firstName: input.firstName.trim(),
    middleNames: input.middleNames?.trim() || undefined,
    lastName: input.lastName.trim(),
    otherLastNames: input.otherLastNames?.trim() || undefined,
    documentType: input.documentType,
    documentNumber: input.documentNumber.trim(),
    documentIssuingCountry: input.documentIssuingCountry.trim(),
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
    geriatricAssessment: {
      cognition: input.geriatricAssessment.cognition,
      mobility: input.geriatricAssessment.mobility,
      feeding: input.geriatricAssessment.feeding,
      skinIntegrity: input.geriatricAssessment.skinIntegrity,
      dependencyLevel: input.geriatricAssessment.dependencyLevel,
      mood: input.geriatricAssessment.mood,
      supportEquipment:
        input.geriatricAssessment.supportEquipment?.trim() || undefined,
      notes: input.geriatricAssessment.notes?.trim() || undefined,
    },
  };
}

function buildEmergencyContact(
  familyContacts: ResidentFamilyContact[],
  fallbackContact?: ContactPerson,
): ContactPerson {
  const primaryFamilyContact = familyContacts[0];

  if (!primaryFamilyContact) {
    return fallbackContact
      ? { ...fallbackContact }
      : {
          fullName: 'Contacto pendiente',
          relationship: 'Pendiente',
          phone: 'Pendiente',
        };
  }

  return {
    fullName: primaryFamilyContact.fullName,
    relationship: primaryFamilyContact.relationship,
    phone: primaryFamilyContact.phone,
    email: primaryFamilyContact.email,
  };
}
