import type {
  AuthRole,
  DashboardAlertSeverity,
  DashboardAlertSource,
  EntityStatus,
  HandoffMedicationStatus,
  MedicationExecutionResult,
  MedicationFrequency,
  MedicationRoute,
  ResidentAttachmentKind,
  ResidentCareLevel,
  ResidentDocumentType,
  ResidentGeriatricAssessmentLevel,
  ResidentObservationEntryType,
  ResidentObservationResolutionType,
  ResidentObservationSeverity,
  ResidentObservationStatus,
  ResidentSex,
} from '@gentrix/shared-types';

const entityStatusLabels: Record<EntityStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  archived: 'Archivado',
};

const residentCareLevelLabels: Record<ResidentCareLevel, string> = {
  independent: 'Independiente',
  assisted: 'Asistido',
  'high-dependency': 'Alta dependencia',
  'memory-care': 'Cuidado de memoria',
};

const residentDocumentTypeLabels: Record<ResidentDocumentType, string> = {
  dni: 'DNI',
  pasaporte: 'Pasaporte',
  cedula: 'Cedula',
  'libreta-civica': 'Libreta civica',
  otro: 'Otro',
};

const residentSexLabels: Record<ResidentSex, string> = {
  femenino: 'Femenino',
  masculino: 'Masculino',
  x: 'X',
};

const residentAttachmentKindLabels: Record<ResidentAttachmentKind, string> = {
  image: 'Imagen',
  pdf: 'PDF',
};

const residentGeriatricAssessmentLevelLabels: Record<
  ResidentGeriatricAssessmentLevel,
  string
> = {
  preserved: 'Conservado',
  monitored: 'Con apoyo / seguimiento',
  'high-support': 'Alta dependencia',
};

const authRoleLabels: Record<AuthRole, string> = {
  admin: 'Admin',
  nurse: 'Enfermeras/os',
  assistant: 'Asistentes',
  'health-director': 'Director de salud',
  external: 'Externos',
};

const medicationRouteLabels: Record<MedicationRoute, string> = {
  oral: 'Oral',
  intravenous: 'Intravenosa',
  subcutaneous: 'Subcutanea',
  topical: 'Topica',
};

const medicationFrequencyLabels: Record<MedicationFrequency, string> = {
  daily: 'A diario',
  'twice-daily': 'Dos veces al dia',
  nightly: 'Por la noche',
  'as-needed': 'Segun necesidad',
};

const medicationExecutionResultLabels: Record<
  MedicationExecutionResult,
  string
> = {
  administered: 'Administrada',
  omitted: 'Omitida',
  rejected: 'Rechazada',
};

const staffRoleLabels: Record<string, string> = {
  nurse: 'Enfermeria',
  doctor: 'Medico',
  caregiver: 'Cuidador',
  coordinator: 'Coordinacion',
};

const shiftLabels: Record<string, string> = {
  morning: 'Manana',
  afternoon: 'Tarde',
  night: 'Noche',
};

const dashboardAlertSeverityLabels: Record<DashboardAlertSeverity, string> = {
  info: 'Info',
  warning: 'Seguimiento',
  critical: 'Critica',
};

const dashboardAlertSourceLabels: Record<DashboardAlertSource, string> = {
  'resident-care-level': 'Cuidado',
  'resident-event': 'Evento',
  'medication-order': 'Medicacion',
  'medication-execution': 'Ejecucion',
};

const handoffMedicationStatusLabels: Record<HandoffMedicationStatus, string> = {
  pending: 'Pendiente',
  omitted: 'Omitida',
  rejected: 'Rechazada',
};

const residentObservationSeverityLabels: Record<
  ResidentObservationSeverity,
  string
> = {
  warning: 'Seguimiento',
  critical: 'Critica',
};

const residentObservationStatusLabels: Record<ResidentObservationStatus, string> =
  {
    active: 'En observacion',
    resolved: 'Resuelta',
  };

const residentObservationEntryTypeLabels: Record<
  ResidentObservationEntryType,
  string
> = {
  'follow-up': 'Seguimiento',
  action: 'Accion',
  resolution: 'Cierre',
};

const residentObservationResolutionTypeLabels: Record<
  ResidentObservationResolutionType,
  string
> = {
  completed: 'Finalizada',
  'phone-call': 'Llamado',
  'medical-visit': 'Visita medica',
};

export function formatEntityStatus(status: EntityStatus): string {
  return entityStatusLabels[status] ?? status;
}

export function formatResidentCareLevel(level: ResidentCareLevel): string {
  return residentCareLevelLabels[level] ?? level;
}

export function formatResidentDocumentType(
  documentType: ResidentDocumentType,
): string {
  return residentDocumentTypeLabels[documentType] ?? documentType;
}

export function formatResidentSex(sex: ResidentSex): string {
  return residentSexLabels[sex] ?? sex;
}

export function formatResidentAttachmentKind(
  kind: ResidentAttachmentKind,
): string {
  return residentAttachmentKindLabels[kind] ?? kind;
}

export function formatResidentGeriatricAssessmentLevel(
  level: ResidentGeriatricAssessmentLevel,
): string {
  return residentGeriatricAssessmentLevelLabels[level] ?? level;
}

export function formatAuthRole(role: AuthRole): string {
  return authRoleLabels[role] ?? role;
}

export function formatMedicationRoute(route: MedicationRoute): string {
  return medicationRouteLabels[route] ?? route;
}

export function formatMedicationFrequency(
  frequency: MedicationFrequency,
): string {
  return medicationFrequencyLabels[frequency] ?? frequency;
}

export function formatMedicationExecutionResult(
  result: MedicationExecutionResult,
): string {
  return medicationExecutionResultLabels[result] ?? result;
}

export function formatStaffRole(role: string): string {
  return staffRoleLabels[role] ?? role;
}

export function formatShiftLabel(shift: string): string {
  return shiftLabels[shift] ?? shift;
}

export function formatDashboardAlertSeverity(
  severity: DashboardAlertSeverity,
): string {
  return dashboardAlertSeverityLabels[severity] ?? severity;
}

export function formatDashboardAlertSource(
  source: DashboardAlertSource,
): string {
  return dashboardAlertSourceLabels[source] ?? source;
}

export function formatHandoffMedicationStatus(
  status: HandoffMedicationStatus,
): string {
  return handoffMedicationStatusLabels[status] ?? status;
}

export function formatResidentObservationSeverity(
  severity: ResidentObservationSeverity,
): string {
  return residentObservationSeverityLabels[severity] ?? severity;
}

export function formatResidentObservationStatus(
  status: ResidentObservationStatus,
): string {
  return residentObservationStatusLabels[status] ?? status;
}

export function formatResidentObservationEntryType(
  entryType: ResidentObservationEntryType,
): string {
  return residentObservationEntryTypeLabels[entryType] ?? entryType;
}

export function formatResidentObservationResolutionType(
  resolutionType: ResidentObservationResolutionType,
): string {
  return (
    residentObservationResolutionTypeLabels[resolutionType] ?? resolutionType
  );
}
