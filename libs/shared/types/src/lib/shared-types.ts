export type EntityId = `${string}-${string}`;

export type IsoDateString = string;

export type EntityStatus = 'active' | 'inactive' | 'archived';

export interface AuditTrail {
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  createdBy: string;
  updatedBy: string;
  deletedAt?: IsoDateString;
  deletedBy?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  room?: string;
}

export interface ContactPerson {
  fullName: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: {
    generatedAt: IsoDateString;
    domain: 'gentrix';
  };
}

export type AuthRole = 'admin' | 'coordinator';

export type ResidentCareLevel =
  | 'independent'
  | 'assisted'
  | 'high-dependency'
  | 'memory-care';

export type ResidentDocumentType =
  | 'dni'
  | 'pasaporte'
  | 'cedula'
  | 'libreta-civica'
  | 'otro';

export type ResidentSex = 'femenino' | 'masculino' | 'x';

export type ResidentAttachmentKind = 'image' | 'pdf';

export interface ResidentMedicalHistoryEntryInput {
  recordedAt: IsoDateString;
  title: string;
  notes: string;
}

export interface ResidentMedicalHistoryEntry
  extends ResidentMedicalHistoryEntryInput {
  id: EntityId;
  createdAt: IsoDateString;
}

export interface ResidentAttachmentInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
}

export interface ResidentAttachment extends ResidentAttachmentInput {
  id: EntityId;
  kind: ResidentAttachmentKind;
  uploadedAt: IsoDateString;
}

export interface ResidentInsuranceInfo {
  provider?: string;
  memberNumber?: string;
}

export interface ResidentTransferInfo {
  provider?: string;
  address?: string;
  phone?: string;
}

export interface ResidentPsychiatricCareInfo {
  provider?: string;
  careLocation?: string;
  address?: string;
  phone?: string;
}

export interface ResidentClinicalProfile {
  allergies?: string;
  emergencyCareLocation?: string;
  clinicalRecordNumber?: string;
  primaryDoctorName?: string;
  primaryDoctorOfficeAddress?: string;
  primaryDoctorOfficePhone?: string;
  pathologies?: string;
  surgeries?: string;
  smokes?: boolean;
  drinksAlcohol?: boolean;
  currentWeightKg?: number;
}

export interface ResidentBelongings {
  glasses: boolean;
  dentures: boolean;
  walker: boolean;
  orthopedicBed: boolean;
  notes?: string;
}

export interface ResidentFamilyContactInput extends ContactPerson {
  address?: string;
  notes?: string;
}

export interface ResidentFamilyContact extends ResidentFamilyContactInput {
  id: EntityId;
}

export interface ResidentDischargeInfo {
  date?: IsoDateString;
  reason?: string;
}

export interface AuthUser {
  id: EntityId;
  fullName: string;
  email: string;
  role: AuthRole;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  user: AuthUser;
  expiresAt: IsoDateString;
}

export interface AuthLoginResponse extends AuthSession {
  token: string;
}

export interface LogoutResponse {
  success: boolean;
}

export interface ResidentOverview {
  id: EntityId;
  fullName: string;
  age: number;
  room: string;
  careLevel: ResidentCareLevel;
  status: EntityStatus;
}

export interface ResidentDetail {
  id: EntityId;
  fullName: string;
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
  age: number;
  birthDate: IsoDateString;
  admissionDate: IsoDateString;
  sex: ResidentSex;
  maritalStatus?: string;
  nationality?: string;
  email?: string;
  room: string;
  careLevel: ResidentCareLevel;
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

export interface ResidentCreateInput {
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
  careLevel: ResidentCareLevel;
  medicalHistory: ResidentMedicalHistoryEntryInput[];
  attachments: ResidentAttachmentInput[];
  insurance: ResidentInsuranceInfo;
  transfer: ResidentTransferInfo;
  psychiatry: ResidentPsychiatricCareInfo;
  clinicalProfile: ResidentClinicalProfile;
  belongings: ResidentBelongings;
  familyContacts: ResidentFamilyContactInput[];
  discharge: ResidentDischargeInfo;
}

export interface StaffOverview {
  id: EntityId;
  name: string;
  role: string;
  ward: string;
  shift: string;
  assignment: string;
  status: EntityStatus;
}

export interface MedicationOverview {
  id: EntityId;
  residentId: EntityId;
  residentName: string;
  medicationName: string;
  active: boolean;
  schedule: string;
}

export interface DashboardSummary {
  residentCount: number;
  staffOnDuty: number;
  activeMedicationCount: number;
  occupancyRate: number;
  memoryCareResidents: number;
}

export interface DashboardSnapshot {
  summary: DashboardSummary;
  residents: ResidentOverview[];
  staff: StaffOverview[];
  medications: MedicationOverview[];
  alerts: string[];
}

export interface ServiceIndex {
  service: string;
  version: string;
  frontend: string;
  endpoints: string[];
  authEndpoints: string[];
}

export interface HealthCheck {
  status: 'ok';
  service: string;
  residents: number;
  staff: number;
  generatedAt: IsoDateString;
}
