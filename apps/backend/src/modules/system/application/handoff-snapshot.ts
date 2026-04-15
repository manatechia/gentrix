import type { MedicationExecution } from '@gentrix/domain-medication';
import { createEntityId, toIsoDateString } from '@gentrix/shared-utils';
import type {
  DashboardAlertSeverity,
  HandoffMedicationIssue,
  HandoffResident,
  HandoffShift,
  HandoffSnapshot,
  MedicationOverview,
  ResidentOverview,
} from '@gentrix/shared-types';

const medicationExecutionMatchWindowMs = 1000 * 60 * 60 * 2;
const facilityUtcOffsetMinutes = -180;

interface DeriveHandoffSnapshotInput {
  residents: ResidentOverview[];
  medications: MedicationOverview[];
  medicationExecutions: MedicationExecution[];
  referenceDate?: Date;
}

interface HandoffShiftContext {
  shift: HandoffShift;
  nextShift: HandoffShift;
  shiftStartedAt: Date;
  shiftEndsAt: Date;
  referenceDate: Date;
}

export function deriveHandoffSnapshot({
  residents,
  medications,
  medicationExecutions,
  referenceDate = new Date(),
}: DeriveHandoffSnapshotInput): HandoffSnapshot {
  const shiftContext = resolveHandoffShiftContext(referenceDate);
  const medicationIssuesByResidentId = buildMedicationIssuesByResidentId(
    medications.filter((medication) => medication.active),
    medicationExecutions,
    shiftContext,
  );
  const relevantResidents = residents
    .filter((resident) => {
      const medicationIssues =
        medicationIssuesByResidentId.get(resident.id) ?? [];

      return medicationIssues.length > 0;
    })
    .map((resident) => {
      const medicationIssues =
        medicationIssuesByResidentId.get(resident.id) ?? [];

      return {
        residentId: resident.id,
        fullName: resident.fullName,
        room: resident.room,
        careLevel: resident.careLevel,
        priority: resolveResidentPriority(resident, medicationIssues),
        medicationIssues,
      } satisfies HandoffResident;
    })
    .sort(compareHandoffResidents);

  return {
    generatedAt: toIsoDateString(shiftContext.referenceDate),
    shift: shiftContext.shift,
    nextShift: shiftContext.nextShift,
    shiftStartedAt: toIsoDateString(shiftContext.shiftStartedAt),
    shiftEndsAt: toIsoDateString(shiftContext.shiftEndsAt),
    summary: {
      residentCount: residents.length,
      relevantResidentCount: relevantResidents.length,
      pendingMedicationCount: countMedicationIssuesByStatus(
        relevantResidents,
        'pending',
      ),
      omittedMedicationCount: countMedicationIssuesByStatus(
        relevantResidents,
        'omitted',
      ),
      rejectedMedicationCount: countMedicationIssuesByStatus(
        relevantResidents,
        'rejected',
      ),
    },
    residents: relevantResidents,
  };
}

function buildMedicationIssuesByResidentId(
  medications: MedicationOverview[],
  medicationExecutions: MedicationExecution[],
  shiftContext: HandoffShiftContext,
): Map<ResidentOverview['id'], HandoffMedicationIssue[]> {
  const executionsByOrderId = new Map<
    MedicationOverview['id'],
    MedicationExecution[]
  >();

  for (const execution of medicationExecutions) {
    const occurredAt = new Date(execution.occurredAt).getTime();

    if (
      !Number.isFinite(occurredAt) ||
      occurredAt < shiftContext.shiftStartedAt.getTime() ||
      occurredAt > shiftContext.referenceDate.getTime()
    ) {
      continue;
    }

    const orderExecutions =
      executionsByOrderId.get(execution.medicationOrderId) ?? [];
    orderExecutions.push(execution);
    executionsByOrderId.set(execution.medicationOrderId, orderExecutions);
  }

  const issuesByResidentId = new Map<
    ResidentOverview['id'],
    HandoffMedicationIssue[]
  >();

  for (const medication of medications) {
    const scheduledDoses = buildShiftScheduledDoses(medication, shiftContext);

    if (scheduledDoses.length === 0) {
      continue;
    }

    const availableExecutions = [
      ...(executionsByOrderId.get(medication.id) ?? []),
    ].sort(
      (left, right) =>
        new Date(left.occurredAt).getTime() -
        new Date(right.occurredAt).getTime(),
    );
    const matchedExecutionsByScheduledTime = assignExecutionsToScheduledDoses(
      scheduledDoses,
      availableExecutions,
    );

    const residentIssues = issuesByResidentId.get(medication.residentId) ?? [];

    for (const scheduledFor of scheduledDoses) {
      const matchingExecution =
        matchedExecutionsByScheduledTime.get(scheduledFor.getTime()) ?? null;

      if (!matchingExecution) {
        residentIssues.push({
          id: createEntityId(
            'handoff-issue',
            `${medication.id}-${scheduledFor.toISOString()}-pending`,
          ),
          medicationOrderId: medication.id,
          medicationName: medication.medicationName,
          status: 'pending',
          scheduledFor: toIsoDateString(scheduledFor),
        });
        continue;
      }

      if (matchingExecution.result === 'administered') {
        continue;
      }

      residentIssues.push({
        id: createEntityId(
          'handoff-issue',
          `${medication.id}-${matchingExecution.id}-${matchingExecution.result}`,
        ),
        medicationOrderId: medication.id,
        medicationName: medication.medicationName,
        status: matchingExecution.result,
        scheduledFor: toIsoDateString(scheduledFor),
        occurredAt: matchingExecution.occurredAt,
        actor: matchingExecution.audit.createdBy,
      });
    }

    if (residentIssues.length > 0) {
      issuesByResidentId.set(
        medication.residentId,
        residentIssues.sort(compareMedicationIssues),
      );
    }
  }

  return issuesByResidentId;
}

function buildShiftScheduledDoses(
  medication: MedicationOverview,
  shiftContext: HandoffShiftContext,
): Date[] {
  const candidateDays = [
    startOfDay(shiftContext.shiftStartedAt),
    startOfDay(shiftContext.shiftEndsAt),
  ];
  const uniqueCandidates = new Map<number, Date>();

  for (const day of candidateDays) {
    for (const scheduleTime of medication.scheduleTimes) {
      const candidate = mergeDateAndTime(day, scheduleTime);

      if (!candidate) {
        continue;
      }

      if (
        candidate.getTime() < shiftContext.shiftStartedAt.getTime() ||
        candidate.getTime() > shiftContext.referenceDate.getTime() ||
        !isScheduledDoseWithinMedicationWindow(medication, candidate)
      ) {
        continue;
      }

      uniqueCandidates.set(candidate.getTime(), candidate);
    }
  }

  return [...uniqueCandidates.values()].sort(
    (left, right) => left.getTime() - right.getTime(),
  );
}

function isScheduledDoseWithinMedicationWindow(
  medication: MedicationOverview,
  scheduledFor: Date,
): boolean {
  const scheduledTime = scheduledFor.getTime();
  const startTime = new Date(medication.startDate).getTime();
  const endTime = medication.endDate
    ? new Date(medication.endDate).getTime()
    : Number.POSITIVE_INFINITY;

  return scheduledTime >= startTime && scheduledTime <= endTime;
}

function assignExecutionsToScheduledDoses(
  scheduledDoses: Date[],
  availableExecutions: MedicationExecution[],
): Map<number, MedicationExecution> {
  const matches = new Map<number, MedicationExecution>();
  const unmatchedScheduledDoses = [...scheduledDoses];

  for (const execution of availableExecutions) {
    let bestDoseIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < unmatchedScheduledDoses.length; index += 1) {
      const scheduledFor = unmatchedScheduledDoses[index];
      const distance = Math.abs(
        new Date(execution.occurredAt).getTime() - scheduledFor.getTime(),
      );

      if (
        distance <= medicationExecutionMatchWindowMs &&
        distance < bestDistance
      ) {
        bestDistance = distance;
        bestDoseIndex = index;
      }
    }

    if (bestDoseIndex === -1) {
      continue;
    }

    const [matchedDose] = unmatchedScheduledDoses.splice(bestDoseIndex, 1);

    if (matchedDose) {
      matches.set(matchedDose.getTime(), execution);
    }
  }

  return matches;
}

function compareMedicationIssues(
  left: HandoffMedicationIssue,
  right: HandoffMedicationIssue,
): number {
  const severityDiff =
    getMedicationIssueSeverityRank(left.status) -
    getMedicationIssueSeverityRank(right.status);

  if (severityDiff !== 0) {
    return severityDiff;
  }

  return (
    new Date(left.scheduledFor).getTime() -
    new Date(right.scheduledFor).getTime()
  );
}

function compareHandoffResidents(
  left: HandoffResident,
  right: HandoffResident,
): number {
  const priorityDiff =
    getResidentPriorityRank(left.priority) -
    getResidentPriorityRank(right.priority);

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const medicationIssueDiff =
    right.medicationIssues.length - left.medicationIssues.length;

  if (medicationIssueDiff !== 0) {
    return medicationIssueDiff;
  }

  const rightLatestActivity = resolveLatestResidentActivity(right);
  const leftLatestActivity = resolveLatestResidentActivity(left);

  if (rightLatestActivity !== leftLatestActivity) {
    return rightLatestActivity - leftLatestActivity;
  }

  return left.fullName.localeCompare(right.fullName);
}

function resolveResidentPriority(
  resident: ResidentOverview,
  medicationIssues: HandoffMedicationIssue[],
): DashboardAlertSeverity {
  if (
    medicationIssues.some((issue) => issue.status === 'rejected') ||
    (resident.careLevel === 'high-dependency' && medicationIssues.length > 0)
  ) {
    return 'critical';
  }

  if (medicationIssues.length > 0) {
    return 'warning';
  }

  return 'info';
}

function resolveLatestResidentActivity(resident: HandoffResident): number {
  const latestMedicationIssue = resident.medicationIssues[0]
    ? new Date(
        resident.medicationIssues[0].occurredAt ??
          resident.medicationIssues[0].scheduledFor,
      ).getTime()
    : Number.NEGATIVE_INFINITY;

  return latestMedicationIssue;
}

function countMedicationIssuesByStatus(
  residents: HandoffResident[],
  status: HandoffMedicationIssue['status'],
): number {
  return residents.reduce(
    (total, resident) =>
      total +
      resident.medicationIssues.filter((issue) => issue.status === status)
        .length,
    0,
  );
}

function getMedicationIssueSeverityRank(
  status: HandoffMedicationIssue['status'],
): number {
  switch (status) {
    case 'rejected':
      return 0;
    case 'omitted':
      return 1;
    default:
      return 2;
  }
}

function getResidentPriorityRank(priority: DashboardAlertSeverity): number {
  switch (priority) {
    case 'critical':
      return 0;
    case 'warning':
      return 1;
    default:
      return 2;
  }
}

function resolveHandoffShiftContext(referenceDate: Date): HandoffShiftContext {
  const localReferenceDate = toFacilityDateParts(referenceDate);
  const hour = localReferenceDate.hours;

  if (hour >= 6 && hour < 14) {
    return {
      shift: 'morning',
      nextShift: 'afternoon',
      shiftStartedAt: buildFacilityDate(localReferenceDate, 6, 0, 0, 0),
      shiftEndsAt: buildFacilityDate(localReferenceDate, 13, 59, 59, 999),
      referenceDate,
    };
  }

  if (hour >= 14 && hour < 22) {
    return {
      shift: 'afternoon',
      nextShift: 'night',
      shiftStartedAt: buildFacilityDate(localReferenceDate, 14, 0, 0, 0),
      shiftEndsAt: buildFacilityDate(localReferenceDate, 21, 59, 59, 999),
      referenceDate,
    };
  }

  if (hour >= 22) {
    const shiftStartedAt = buildFacilityDate(localReferenceDate, 22, 0, 0, 0);
    const shiftEndsAt = buildFacilityDate(
      addFacilityDays(localReferenceDate, 1),
      5,
      59,
      59,
      999,
    );

    return {
      shift: 'night',
      nextShift: 'morning',
      shiftStartedAt,
      shiftEndsAt,
      referenceDate,
    };
  }

  return {
    shift: 'night',
    nextShift: 'morning',
    shiftStartedAt: buildFacilityDate(
      addFacilityDays(localReferenceDate, -1),
      22,
      0,
      0,
      0,
    ),
    shiftEndsAt: buildFacilityDate(localReferenceDate, 5, 59, 59, 999),
    referenceDate,
  };
}

function mergeDateAndTime(baseDate: Date, scheduleTime: string): Date | null {
  const [hoursText, minutesText] = scheduleTime.split(':');
  const hours = Number.parseInt(hoursText ?? '', 10);
  const minutes = Number.parseInt(minutesText ?? '', 10);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return buildFacilityDate(toFacilityDateParts(baseDate), hours, minutes, 0, 0);
}

function startOfDay(value: Date): Date {
  return buildFacilityDate(toFacilityDateParts(value), 0, 0, 0, 0);
}

function buildFacilityDate(
  baseDate: FacilityDateParts,
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
): Date {
  return new Date(
    Date.UTC(
      baseDate.year,
      baseDate.monthIndex,
      baseDate.day,
      hours,
      minutes,
      seconds,
      milliseconds,
    ) -
      facilityUtcOffsetMinutes * 60_000,
  );
}

function addFacilityDays(value: FacilityDateParts, days: number): FacilityDateParts {
  const nextDate = new Date(
    Date.UTC(value.year, value.monthIndex, value.day + days, 12, 0, 0, 0),
  );

  return {
    year: nextDate.getUTCFullYear(),
    monthIndex: nextDate.getUTCMonth(),
    day: nextDate.getUTCDate(),
    hours: value.hours,
    minutes: value.minutes,
  };
}

interface FacilityDateParts {
  year: number;
  monthIndex: number;
  day: number;
  hours: number;
  minutes: number;
}

function toFacilityDateParts(value: Date): FacilityDateParts {
  const shifted = new Date(value.getTime() + facilityUtcOffsetMinutes * 60_000);

  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}
