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

export type AuthRole =
  | 'admin'
  | 'nurse'
  | 'assistant'
  | 'health-director'
  | 'external';

export type UserCreateRole = Exclude<AuthRole, 'admin'>;

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

export type ResidentGeriatricAssessmentLevel =
  | 'preserved'
  | 'monitored'
  | 'high-support';

export interface ResidentGeriatricAssessment {
  cognition?: ResidentGeriatricAssessmentLevel;
  mobility?: ResidentGeriatricAssessmentLevel;
  feeding?: ResidentGeriatricAssessmentLevel;
  skinIntegrity?: ResidentGeriatricAssessmentLevel;
  dependencyLevel?: ResidentGeriatricAssessmentLevel;
  mood?: ResidentGeriatricAssessmentLevel;
  supportEquipment?: string;
  notes?: string;
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
  geriatricAssessment: ResidentGeriatricAssessment;
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
  geriatricAssessment: ResidentGeriatricAssessment;
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

export interface UserOverview {
  id: EntityId;
  fullName: string;
  email: string;
  role: AuthRole;
  status: EntityStatus;
}

export interface UserCreateInput {
  fullName: string;
  email: string;
  role: UserCreateRole;
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
 * preserve child identities without rewriting the full snapshot. The VGI block
 * remains editable because it is part of the living resident profile.
 */
export interface ResidentBaseUpdateInput
  extends ResidentBaseProfileInput,
    ResidentCurrentStateInput {
  geriatricAssessment: ResidentGeriatricAssessment;
}

export type ResidentUpdateInput = ResidentBaseUpdateInput;

/**
 * ResidentEvent is the stable API/domain contract for the resident timeline.
 * It currently sits on top of the persisted ClinicalHistoryEvent model.
 */
export type ResidentEventType =
  | 'medical-history'
  | 'admission-note'
  | 'follow-up';

export type ResidentEventCreatableType = Exclude<
  ResidentEventType,
  'medical-history'
>;

export interface ResidentEvent {
  id: EntityId;
  residentId: EntityId;
  eventType: ResidentEventType;
  title: string;
  description: string;
  occurredAt: IsoDateString;
  actor: string;
  audit: AuditTrail;
}

export interface ResidentEventCreateInput {
  eventType: ResidentEventCreatableType;
  title: string;
  description: string;
  occurredAt: IsoDateString;
}

export type ResidentObservationSeverity = 'warning' | 'critical';

export type ResidentObservationStatus = 'active' | 'resolved';

export type ResidentObservationEntryType =
  | 'follow-up'
  | 'action'
  | 'resolution';

export type ResidentObservationEntryCreatableType = Exclude<
  ResidentObservationEntryType,
  'resolution'
>;

export type ResidentObservationResolutionType =
  | 'completed'
  | 'phone-call'
  | 'medical-visit';

export interface ResidentObservationEntry {
  id: EntityId;
  observationId: EntityId;
  residentId: EntityId;
  entryType: ResidentObservationEntryType;
  title: string;
  description: string;
  occurredAt: IsoDateString;
  actor: string;
  audit: AuditTrail;
}

export interface ResidentObservation {
  id: EntityId;
  residentId: EntityId;
  status: ResidentObservationStatus;
  severity: ResidentObservationSeverity;
  title: string;
  description: string;
  openedAt: IsoDateString;
  openedBy: string;
  resolvedAt?: IsoDateString;
  resolvedBy?: string;
  resolutionType?: ResidentObservationResolutionType;
  resolutionSummary?: string;
  entries: ResidentObservationEntry[];
  audit: AuditTrail;
}

export interface ResidentObservationCreateInput {
  severity: ResidentObservationSeverity;
  title: string;
  description: string;
}

export interface ResidentObservationEntryCreateInput {
  entryType: ResidentObservationEntryCreatableType;
  title: string;
  description: string;
}

export interface ResidentObservationResolveInput {
  resolutionType: ResidentObservationResolutionType;
  summary: string;
}

export interface ResidentLiveProfileResident
  extends ResidentBaseProfile,
    ResidentCurrentState {
  id: EntityId;
  fullName: string;
  age: number;
  internalNumber?: string;
  status: EntityStatus;
}

export interface ResidentLiveProfile {
  resident: ResidentLiveProfileResident;
  activeMedications: MedicationOverview[];
  recentEvents: ResidentEvent[];
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

export interface StaffSchedule {
  id: EntityId;
  staffId: EntityId;
  weekday: number;
  startTime: string;
  endTime: string;
  exceptionDate?: IsoDateString;
  coverageNote?: string;
  audit: AuditTrail;
}

export interface StaffScheduleCreateInput {
  weekday: number;
  startTime: string;
  endTime: string;
  exceptionDate?: IsoDateString;
  coverageNote?: string;
}

export type StaffScheduleUpdateInput = StaffScheduleCreateInput;

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

/**
 * MedicationOverview is the read model of the current medication order.
 * It describes the prescribed regimen that is in force for the resident.
 * It is not evidence that a concrete dose was administered, omitted or rejected.
 * Those execution facts belong to the separate MedicationExecution model linked
 * to the order and later projected into timelines or alerts.
 */
export interface MedicationOverview {
  id: EntityId;
  medicationCatalogId: EntityId;
  residentId: EntityId;
  residentName: string;
  medicationName: string;
  dose: string;
  route: MedicationRoute;
  frequency: MedicationFrequency;
  /**
   * Planned times declared by the current prescription.
   * They are not execution records.
   */
  scheduleTimes: string[];
  prescribedBy: string;
  startDate: IsoDateString;
  endDate?: IsoDateString;
  status: EntityStatus;
  active: boolean;
  schedule: string;
  audit: AuditTrail;
}

export interface MedicationDetail extends MedicationOverview {
  audit: AuditTrail;
}

/**
 * MedicationCreateInput writes the current prescription order only.
 * Daily execution such as administration, omission or rejection must be modeled
 * through the dedicated MedicationExecution contract instead of extending this
 * input.
 */
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

/**
 * Updating a medication order changes the active prescription, not what happened
 * to a concrete dose at a specific time.
 */
export type MedicationUpdateInput = MedicationCreateInput;

export interface ClinicalHistoryEvent {
  id: EntityId;
  residentId: EntityId;
  eventType: string;
  title: string;
  description: string;
  occurredAt: IsoDateString;
  audit: AuditTrail;
}

export interface ClinicalHistoryEventCreateInput {
  eventType: string;
  title: string;
  description: string;
  occurredAt: IsoDateString;
}

export type MedicationExecutionResult = 'administered' | 'omitted' | 'rejected';

export interface MedicationExecutionCreateInput {
  occurredAt: IsoDateString;
  result: MedicationExecutionResult;
}

export interface MedicationExecutionOverview {
  id: EntityId;
  medicationOrderId: EntityId;
  residentId: EntityId;
  residentName: string;
  medicationName: string;
  result: MedicationExecutionResult;
  occurredAt: IsoDateString;
  actor: string;
  audit: AuditTrail;
}

export type DashboardAlertSeverity = 'info' | 'warning' | 'critical';

export type DashboardAlertSource =
  | 'resident-care-level'
  | 'resident-event'
  | 'medication-order'
  | 'medication-execution';

export interface DashboardAlert {
  id: EntityId;
  severity: DashboardAlertSeverity;
  source: DashboardAlertSource;
  title: string;
  message: string;
  residentId?: EntityId;
  residentName?: string;
  occurredAt?: IsoDateString;
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
  alerts: DashboardAlert[];
}

export type HandoffShift = 'morning' | 'afternoon' | 'night';

export type HandoffMedicationStatus = 'pending' | 'omitted' | 'rejected';

export interface HandoffMedicationIssue {
  id: EntityId;
  medicationOrderId: EntityId;
  medicationName: string;
  status: HandoffMedicationStatus;
  scheduledFor: IsoDateString;
  occurredAt?: IsoDateString;
  actor?: string;
}

export interface HandoffObservation {
  id: EntityId;
  severity: ResidentObservationSeverity;
  title: string;
  description: string;
  openedAt: IsoDateString;
  openedBy: string;
  latestEntryAt?: IsoDateString;
  latestEntrySummary?: string;
}

export interface HandoffResident {
  residentId: EntityId;
  fullName: string;
  room: string;
  careLevel: ResidentCareLevel;
  priority: DashboardAlertSeverity;
  observations: HandoffObservation[];
  recentEvents: ResidentEvent[];
  medicationIssues: HandoffMedicationIssue[];
}

export interface HandoffSummary {
  residentCount: number;
  relevantResidentCount: number;
  activeObservationCount: number;
  recentEventCount: number;
  pendingMedicationCount: number;
  omittedMedicationCount: number;
  rejectedMedicationCount: number;
}

export interface HandoffSnapshot {
  generatedAt: IsoDateString;
  shift: HandoffShift;
  nextShift: HandoffShift;
  shiftStartedAt: IsoDateString;
  shiftEndsAt: IsoDateString;
  summary: HandoffSummary;
  residents: HandoffResident[];
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
