import type { MedicationExecution } from '@gentrix/domain-medication';
import { createEntityId } from '@gentrix/shared-utils';
import type {
  DashboardAlert,
  MedicationExecutionResult,
  MedicationOverview,
  MedicationRoute,
  ResidentCareLevel,
  ResidentOverview,
} from '@gentrix/shared-types';

const dashboardAlertLimit = 6;
const medicationExecutionAlertLimit = 2;
const residentCareAlertLimit = 2;
const medicationOrderAlertLimit = 1;
const medicationExecutionWindowMs = 1000 * 60 * 60 * 48;

const residentCareLevelLabels: Record<ResidentCareLevel, string> = {
  independent: 'independiente',
  assisted: 'asistido',
  'high-dependency': 'alta dependencia',
  'memory-care': 'cuidado de memoria',
};

const medicationRouteLabels: Record<MedicationRoute, string> = {
  oral: 'oral',
  intravenous: 'intravenosa',
  subcutaneous: 'subcutanea',
  topical: 'topica',
};

const medicationExecutionLabels: Record<MedicationExecutionResult, string> = {
  administered: 'administrada',
  omitted: 'omitida',
  rejected: 'rechazada',
};

interface DeriveDashboardAlertsInput {
  residents: ResidentOverview[];
  medications: MedicationOverview[];
  medicationExecutions: MedicationExecution[];
  referenceDate?: Date;
}

export function deriveDashboardAlerts({
  residents,
  medications,
  medicationExecutions,
  referenceDate = new Date(),
}: DeriveDashboardAlertsInput): DashboardAlert[] {
  const residentsById = new Map(
    residents.map((resident) => [resident.id, resident]),
  );
  const activeMedications = medications.filter(
    (medication) => medication.active,
  );

  const alerts = [
    ...buildMedicationExecutionAlerts(
      medicationExecutions,
      residentsById,
      referenceDate,
    ).slice(0, medicationExecutionAlertLimit),
    ...buildResidentCareAlerts(residents).slice(0, residentCareAlertLimit),
    ...buildMedicationOrderAlerts(activeMedications).slice(
      0,
      medicationOrderAlertLimit,
    ),
  ];

  return alerts.sort(compareDashboardAlerts).slice(0, dashboardAlertLimit);
}

function buildMedicationExecutionAlerts(
  executions: MedicationExecution[],
  residentsById: Map<ResidentOverview['id'], ResidentOverview>,
  referenceDate: Date,
): DashboardAlert[] {
  const referenceTime = referenceDate.getTime();

  return executions
    .filter((execution) => execution.result !== 'administered')
    .filter((execution) => {
      const occurredAt = new Date(execution.occurredAt).getTime();
      return (
        Number.isFinite(occurredAt) &&
        occurredAt <= referenceTime &&
        referenceTime - occurredAt <= medicationExecutionWindowMs
      );
    })
    .map((execution) => {
      const resident = residentsById.get(execution.residentId);
      const residentLabel = resident
        ? `${resident.fullName} en ${resident.room}`
        : 'residente sin referencia';
      const severity = execution.result === 'rejected' ? 'critical' : 'warning';

      return {
        id: createEntityId(
          'dashboard-alert',
          `${execution.id}-${execution.result}`,
        ),
        severity,
        source: 'medication-execution',
        title:
          execution.result === 'rejected' ? 'Toma rechazada' : 'Toma omitida',
        message: `Se registro una toma ${medicationExecutionLabels[execution.result]} de ${execution.medicationName} para ${residentLabel}.`,
        residentId: resident?.id,
        residentName: resident?.fullName,
        occurredAt: execution.occurredAt,
      } satisfies DashboardAlert;
    })
    .sort(compareDashboardAlerts);
}

function buildResidentCareAlerts(
  residents: ResidentOverview[],
): DashboardAlert[] {
  return residents
    .filter(
      (resident) =>
        resident.careLevel === 'high-dependency' ||
        resident.careLevel === 'memory-care',
    )
    .map((resident) => {
      const severity =
        resident.careLevel === 'high-dependency' ? 'critical' : 'warning';
      const title =
        resident.careLevel === 'high-dependency'
          ? 'Cobertura clinica prioritaria'
          : 'Seguimiento reforzado';

      return {
        id: createEntityId(
          'dashboard-alert',
          `${resident.id}-${resident.careLevel}`,
        ),
        severity,
        source: 'resident-care-level',
        title,
        message: `${resident.fullName} en ${resident.room} permanece en ${residentCareLevelLabels[resident.careLevel]} y requiere seguimiento operativo sostenido.`,
        residentId: resident.id,
        residentName: resident.fullName,
      } satisfies DashboardAlert;
    })
    .sort(compareDashboardAlerts);
}

function buildMedicationOrderAlerts(
  medications: MedicationOverview[],
): DashboardAlert[] {
  return medications
    .filter(
      (medication) =>
        medication.route === 'intravenous' ||
        medication.route === 'subcutaneous',
    )
    .map(
      (medication) =>
        ({
          id: createEntityId(
            'dashboard-alert',
            `${medication.id}-${medication.route}`,
          ),
          severity: medication.route === 'intravenous' ? 'critical' : 'warning',
          source: 'medication-order',
          title: 'Medicacion inyectable activa',
          message: `${medication.residentName} tiene ${medication.medicationName} por via ${medicationRouteLabels[medication.route]} programada a las ${formatScheduleTimes(medication.scheduleTimes)}.`,
          residentId: medication.residentId,
          residentName: medication.residentName,
        }) satisfies DashboardAlert,
    )
    .sort(compareDashboardAlerts);
}

function compareDashboardAlerts(
  left: DashboardAlert,
  right: DashboardAlert,
): number {
  const severityDiff =
    getDashboardAlertSeverityRank(left.severity) -
    getDashboardAlertSeverityRank(right.severity);

  if (severityDiff !== 0) {
    return severityDiff;
  }

  const rightOccurredAt = right.occurredAt
    ? new Date(right.occurredAt).getTime()
    : Number.NEGATIVE_INFINITY;
  const leftOccurredAt = left.occurredAt
    ? new Date(left.occurredAt).getTime()
    : Number.NEGATIVE_INFINITY;

  if (rightOccurredAt !== leftOccurredAt) {
    return rightOccurredAt - leftOccurredAt;
  }

  return left.title.localeCompare(right.title);
}

function getDashboardAlertSeverityRank(
  severity: DashboardAlert['severity'],
): number {
  switch (severity) {
    case 'critical':
      return 0;
    case 'warning':
      return 1;
    default:
      return 2;
  }
}

function formatScheduleTimes(scheduleTimes: string[]): string {
  return scheduleTimes.length > 0
    ? scheduleTimes.join(', ')
    : 'horario a confirmar';
}
