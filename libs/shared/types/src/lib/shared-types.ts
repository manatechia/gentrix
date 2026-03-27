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

/**
 * Stable resident data identifies the person and their base profile.
 * It must stay separate from temporal events and derived operational signals.
 */
export interface ResidentBaseProfileInput {
  firstName: string;
  middleNames?: string;
  lastName: string;
  otherLastNames?: string;
  documentType: ResidentDocumentType;
  documentNumber: string;
  documentIssuingCountry: string;
  procedureNumber?: string;
  cuil?: string;
  birthDate: IsoDateString;
  admissionDate: IsoDateString;
  sex: ResidentSex;
  maritalStatus?: string;
  nationality?: string;
  email?: string;
}

export interface ResidentBaseProfile extends ResidentBaseProfileInput {
  internalNumber?: string;
}

/**
 * Current resident state can change during operations without redefining identity.
 * Active medication belongs to this group even if it is served from another module.
 */
export interface ResidentCurrentStateInput {
  room: string;
  careLevel: ResidentCareLevel;
}

export interface ResidentCurrentState extends ResidentCurrentStateInput {
  status: EntityStatus;
}

/**
 * These records are captured around admission/intake today, but they are not
 * the resident's stable identity and must not become a catch-all write contract.
 */
export interface ResidentSupportingRecordInput {
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

export interface ResidentSupportingRecordSnapshot {
  medicalHistory: ResidentMedicalHistoryEntry[];
  attachments: ResidentAttachment[];
  insurance: ResidentInsuranceInfo;
  transfer: ResidentTransferInfo;
  psychiatry: ResidentPsychiatricCareInfo;
  clinicalProfile: ResidentClinicalProfile;
  belongings: ResidentBelongings;
  familyContacts: ResidentFamilyContact[];
  discharge: ResidentDischargeInfo;
}

export interface AuthUser {
  id: EntityId;
  fullName: string;
  email: string;
  role: AuthRole;
}

export interface AuthOrganization {
  id: EntityId;
  slug: string;
  displayName: string;
}

export interface AuthFacility {
  id: EntityId;
  code: string;
  name: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  user: AuthUser;
  activeOrganization: AuthOrganization;
  activeFacility?: AuthFacility;
  expiresAt: IsoDateString;
}

export interface AuthLoginResponse extends AuthSession {
  token: string;
}

export interface LogoutResponse {
  success: boolean;
}

export interface ResidentOverview extends ResidentCurrentState {
  id: EntityId;
  fullName: string;
  age: number;
}

export interface ResidentDetail
  extends ResidentBaseProfile,
    ResidentCurrentState,
    ResidentSupportingRecordSnapshot {
  id: EntityId;
  fullName: string;
  age: number;
  address: Address;
  emergencyContact: ContactPerson;
  audit: AuditTrail;
}

export interface ResidentCreateInput
  extends ResidentBaseProfileInput,
    ResidentCurrentStateInput,
    ResidentSupportingRecordInput {}

/**
 * Resident updates are limited to the base profile and current state.
 * Supporting intake records stay outside this contract so base edits can
 * preserve child identities without rewriting the full snapshot.
 */
export interface ResidentBaseUpdateInput
  extends ResidentBaseProfileInput,
    ResidentCurrentStateInput {}

export interface ResidentUpdateInput extends ResidentBaseUpdateInput {}

export interface StaffOverview {
  id: EntityId;
  name: string;
  role: string;
  ward: string;
  shift: string;
  assignment: string;
  status: EntityStatus;
}

export type MedicationRoute =
  | 'oral'
  | 'intravenous'
  | 'subcutaneous'
  | 'topical';

export type MedicationFrequency =
  | 'daily'
  | 'twice-daily'
  | 'nightly'
  | 'as-needed';

export interface MedicationCatalogItem {
  id: EntityId;
  medicationName: string;
  activeIngredient?: string;
  status: EntityStatus;
}

export interface MedicationOverview {
  id: EntityId;
  medicationCatalogId: EntityId;
  residentId: EntityId;
  residentName: string;
  medicationName: string;
  dose: string;
  route: MedicationRoute;
  frequency: MedicationFrequency;
  scheduleTimes: string[];
  prescribedBy: string;
  startDate: IsoDateString;
  endDate?: IsoDateString;
  status: EntityStatus;
  active: boolean;
  schedule: string;
}

export interface MedicationDetail extends MedicationOverview {
  audit: AuditTrail;
}

export interface MedicationCreateInput {
  medicationCatalogId: EntityId;
  residentId: EntityId;
  dose: string;
  route: MedicationRoute;
  frequency: MedicationFrequency;
  scheduleTimes: string[];
  prescribedBy: string;
  startDate: IsoDateString;
  endDate?: IsoDateString;
  status: EntityStatus;
}

export interface MedicationUpdateInput extends MedicationCreateInput {}

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
