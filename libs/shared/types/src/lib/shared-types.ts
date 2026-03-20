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
  age: number;
  birthDate: IsoDateString;
  admissionDate: IsoDateString;
  sex: ResidentSex;
  email?: string;
  room: string;
  careLevel: ResidentCareLevel;
  status: EntityStatus;
  medicalHistory: ResidentMedicalHistoryEntry[];
  attachments: ResidentAttachment[];
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
  birthDate: IsoDateString;
  sex: ResidentSex;
  email?: string;
  room: string;
  careLevel: ResidentCareLevel;
  medicalHistory: ResidentMedicalHistoryEntryInput[];
  attachments: ResidentAttachmentInput[];
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
