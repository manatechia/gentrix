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
  /**
   * Estado clínico operativo del residente. Este campo es independiente de
   * `status` (ciclo de vida administrativo de la entidad) y modela situaciones
   * que requieren atención reforzada del equipo, como la observación.
   *
   * Se diseñó como string-union extensible para poder sumar más estados
   * (`en_aislamiento`, `cuidados_paliativos`, etc.) sin migración rompiendo.
   */
  careStatus: ResidentCareStatus;
  careStatusChangedAt?: IsoDateString;
  careStatusChangedBy?: string;
}

/**
 * Estados clínicos operativos del residente. Extender este tipo unión cuando
 * aparezcan nuevos estados, y declarar las transiciones permitidas en
 * `RESIDENT_CARE_STATUS_TRANSITIONS`.
 */
export type ResidentCareStatus = 'normal' | 'en_observacion';

export const RESIDENT_CARE_STATUSES: readonly ResidentCareStatus[] = [
  'normal',
  'en_observacion',
] as const;

/**
 * Tabla de transiciones permitidas. La política de dominio
 * (`care-status.policy.ts`) consume esta tabla. Para sumar reglas
 * (ej.: limitar quién puede revertir), envolver con un guard adicional.
 */
export const RESIDENT_CARE_STATUS_TRANSITIONS: Record<
  ResidentCareStatus,
  readonly ResidentCareStatus[]
> = {
  normal: ['en_observacion'],
  en_observacion: ['normal'],
} as const;

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
  /**
   * When true the user can authenticate but must be forced to the
   * password-change screen until they pick a new password that meets policy.
   */
  forcePasswordChange: boolean;
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
  forcePasswordChange: boolean;
  passwordChangedAt: IsoDateString | null;
}

/**
 * Response returned to an admin that just reset another user's password.
 * The temporary password is shown to the admin only once so they can relay
 * it to the affected user through an out-of-band channel.
 */
export interface PasswordResetResponse {
  userId: EntityId;
  temporaryPassword: string;
  forcePasswordChange: true;
  resetAt: IsoDateString;
}

/**
 * Payload submitted by a user that is on the forced password-change screen.
 * The server enforces the full password policy, so the client only needs to
 * send the raw new password and a confirmation.
 */
export interface ForcedPasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
 * Evento de agenda del residente: actividad futura asociada al residente
 * (dar medicación, llevar a una clase, recordatorio de turno, etc.).
 *
 * No tiene duración ni fin: es un recordatorio puntual. La ejecución o
 * seguimiento de la actividad vive en otros contratos (MedicationExecution).
 * La agenda sólo apoya la pregunta operativa
 * "qué sigue para este residente".
 */
export interface ResidentAgendaEvent {
  id: EntityId;
  residentId: EntityId;
  title: string;
  description?: string;
  /**
   * Fecha y hora programada del evento como ISO 8601. Combina fecha y hora
   * del SDD en un único timestamp para permitir orden cronológico trivial
   * y evitar ambigüedades de zona horaria.
   */
  scheduledAt: IsoDateString;
  audit: AuditTrail;
}

/**
 * Evento de agenda con la identidad mínima del residente adjunta. Lo usamos
 * en el bloque "Próximas tareas" del dashboard, donde cada fila linkea a la
 * ficha del residente y conviene no tener que resolver el nombre en el cliente.
 */
export interface ResidentAgendaEventWithResident extends ResidentAgendaEvent {
  residentFullName: string;
  residentRoom: string;
}

export interface ResidentAgendaEventCreateInput {
  title: string;
  description?: string;
  scheduledAt: IsoDateString;
}

export interface ResidentAgendaEventUpdateInput {
  title: string;
  description?: string;
  scheduledAt: IsoDateString;
}

/**
 * Tipos de recurrencia soportados por la agenda.
 *   - `daily`: todos los días.
 *   - `weekly`: días específicos de la semana (`daysOfWeek`, 0=Dom..6=Sab).
 *   - `monthly`: mismo día del mes que `startsOn`. Meses sin ese día se saltean.
 *   - `yearly`: mismo mes y día que `startsOn`. 29/feb en año no bisiesto se saltea.
 */
export type ResidentAgendaRecurrenceType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';

/**
 * Regla de recurrencia de la agenda. Una serie sola representa "este evento se
 * repite a esta hora según este patrón". Para más de un horario por día crear
 * más de una serie.
 */
export interface ResidentAgendaSeries {
  id: EntityId;
  residentId: EntityId;
  title: string;
  description?: string;
  recurrenceType: ResidentAgendaRecurrenceType;
  recurrenceDaysOfWeek: number[]; // sólo weekly, 0..6
  timeOfDay: string; // 'HH:mm' en TZ de la organización
  startsOn: IsoDateString; // YYYY-MM-DD
  endsOn?: IsoDateString; // opcional, YYYY-MM-DD
  audit: AuditTrail;
}

export interface ResidentAgendaSeriesCreateInput {
  title: string;
  description?: string;
  recurrenceType: ResidentAgendaRecurrenceType;
  recurrenceDaysOfWeek?: number[];
  timeOfDay: string;
  startsOn: IsoDateString;
  endsOn?: IsoDateString;
}

export type ResidentAgendaSeriesUpdateInput = ResidentAgendaSeriesCreateInput;

/**
 * Override de una ocurrencia puntual. `overrideScheduledAt` es opcional:
 * permite reprogramar la ocurrencia a otro momento del día sin tocar la serie.
 */
export interface ResidentAgendaOccurrenceOverrideInput {
  title: string;
  description?: string;
  overrideScheduledAt?: IsoDateString;
}

/**
 * Ocurrencia calculada para listar en UI. Puede provenir de un evento one-off
 * o de la expansión de una serie. Se arma en el servidor expandiendo las reglas
 * contra el día pedido (hoy, en la TZ de la organización).
 */
export interface ResidentAgendaOccurrence {
  sourceType: 'event' | 'series';
  sourceId: EntityId;
  residentId: EntityId;
  occurrenceDate?: IsoDateString; // YYYY-MM-DD, solo para sourceType='series'
  isOverride?: boolean;
  exceptionId?: EntityId;
  title: string;
  description?: string;
  scheduledAt: IsoDateString;
  recurrence?: {
    type: ResidentAgendaRecurrenceType;
    daysOfWeek: number[];
    endsOn?: IsoDateString;
    /** Útil para editar la serie desde una ocurrencia sin pedir la serie completa. */
    startsOn: IsoDateString;
    timeOfDay: string;
  };
  audit: AuditTrail;
}

export interface ResidentAgendaOccurrenceWithResident
  extends ResidentAgendaOccurrence {
  residentFullName: string;
  residentRoom: string;
}

/**
 * Observación simple del residente: una nota de texto libre que el staff
 * registra durante el turno. El timestamp (createdAt) lo fija el backend.
 * Orden natural de lectura: más recientes primero.
 */
export interface ResidentObservationNote {
  id: EntityId;
  residentId: EntityId;
  note: string;
  audit: AuditTrail;
}

export interface ResidentObservationNoteCreateInput {
  note: string;
  /**
   * Si true, el servicio transiciona al residente a `en_observacion`
   * (vía ResidentsService.setResidentCareStatus). No-op silencioso si
   * ya estaba en ese estado.
   */
  putUnderObservation?: boolean;
}

/**
 * Respuesta del endpoint POST de creación de observación. `careStatusChanged`
 * es true solo si el cliente pidió `putUnderObservation` y la transición se
 * aplicó efectivamente (residente pasó de `normal` a `en_observacion`).
 */
export interface ResidentObservationNoteCreateResponse {
  note: ResidentObservationNote;
  careStatusChanged: boolean;
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

/**
 * Payload para cambiar manualmente el estado clínico del residente
 * (ej.: el botón "Quitar de observación" en la ficha del residente).
 */
export interface ResidentCareStatusUpdateInput {
  toStatus: ResidentCareStatus;
}

/**
 * Respuesta del endpoint que cambia el estado clínico operativo del residente
 * directamente (ej.: botón "Quitar de observación").
 */
export interface ResidentCareStatusChangeResponse {
  resident: ResidentDetail;
  changed: boolean;
  fromStatus: ResidentCareStatus;
  toStatus: ResidentCareStatus;
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

export type ResidentShiftDoseStatus =
  | 'pending'
  | MedicationExecutionResult;

/**
 * Una dosis programada para el residente dentro del turno consultado.
 * `status` refleja el estado concreto (pending si no hay ejecución todavía, o el
 * resultado cuando sí la hay) para que la UI decida qué acciones ofrecer.
 */
export interface ResidentShiftDose {
  /** Id estable derivado de medicationOrderId + scheduledFor. */
  id: EntityId;
  medicationOrderId: EntityId;
  medicationName: string;
  dose: string;
  route: MedicationRoute;
  scheduledFor: IsoDateString;
  status: ResidentShiftDoseStatus;
  /** Presentes sólo cuando hay una ejecución registrada para esta dosis. */
  executionId?: EntityId;
  occurredAt?: IsoDateString;
  actor?: string;
}

export interface ResidentShiftDoses {
  shift: HandoffShift;
  shiftStartedAt: IsoDateString;
  shiftEndsAt: IsoDateString;
  generatedAt: IsoDateString;
  doses: ResidentShiftDose[];
}

export type DashboardAlertSeverity = 'info' | 'warning' | 'critical';

export type DashboardAlertSource =
  | 'resident-care-level'
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

export interface HandoffResident {
  residentId: EntityId;
  fullName: string;
  room: string;
  careLevel: ResidentCareLevel;
  priority: DashboardAlertSeverity;
  medicationIssues: HandoffMedicationIssue[];
  /**
   * Dosis programadas del próximo turno para este residente. Siempre tienen
   * `status: 'pending'`; se incluyen para que el turno entrante sepa qué se
   * viene apenas tome el relevo.
   */
  upcomingDoses: ResidentShiftDose[];
}

export interface HandoffSummary {
  residentCount: number;
  relevantResidentCount: number;
  pendingMedicationCount: number;
  omittedMedicationCount: number;
  rejectedMedicationCount: number;
  /** Total de dosis proyectadas para el próximo turno en todos los residentes. */
  upcomingDoseCount: number;
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
