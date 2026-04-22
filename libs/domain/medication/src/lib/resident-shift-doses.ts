import type {
  HandoffShift,
  MedicationRoute,
  ResidentShiftDose,
  ResidentShiftDoseStatus,
  ResidentShiftDoses,
} from '@gentrix/shared-types';
import { createEntityId, toIsoDateString } from '@gentrix/shared-utils';

import type { MedicationExecution, MedicationOrder } from './domain-medication';
import { isMedicationActive } from './domain-medication';

/**
 * Ventana tolerada entre la dosis programada y una ejecución real para
 * considerarlas el mismo registro. Dos horas — igual criterio que el handoff.
 */
const medicationExecutionMatchWindowMs = 1000 * 60 * 60 * 2;

/**
 * Zona horaria de la residencia (fija hoy). Si en el futuro soportamos múltiples
 * facilities con distintas zonas, este offset pasa a venir del registro.
 */
const facilityUtcOffsetMinutes = -180;

interface ShiftWindow {
  shift: HandoffShift;
  shiftStartedAt: Date;
  shiftEndsAt: Date;
}

/**
 * Calcula las dosis del turno actual para un residente, uniéndolas con las
 * ejecuciones ya registradas. Las dosis sin ejecución quedan `pending`; las
 * ejecutadas quedan en su `result` (administered/omitted/rejected).
 *
 * Esta función es pura: dados los mismos inputs y la misma referenceDate,
 * devuelve siempre el mismo resultado.
 */
export function computeResidentShiftDoses(input: {
  medications: MedicationOrder[];
  executions: MedicationExecution[];
  referenceDate?: Date;
}): ResidentShiftDoses {
  const referenceDate = input.referenceDate ?? new Date();
  const shiftWindow = resolveShiftWindow(referenceDate);

  const doses: ResidentShiftDose[] = [];

  for (const medication of input.medications) {
    if (medication.status !== 'active') {
      continue;
    }

    const scheduledDoses = buildShiftScheduledDoses(medication, shiftWindow);
    if (scheduledDoses.length === 0) {
      continue;
    }

    const candidateExecutions = input.executions
      .filter((execution) => execution.medicationOrderId === medication.id)
      .sort(
        (left, right) =>
          new Date(left.occurredAt).getTime() -
          new Date(right.occurredAt).getTime(),
      );

    const matches = assignExecutionsToScheduledDoses(
      scheduledDoses,
      candidateExecutions,
    );

    for (const scheduledFor of scheduledDoses) {
      const execution = matches.get(scheduledFor.getTime());
      const scheduledForIso = toIsoDateString(scheduledFor);
      const doseId = createEntityId(
        'shift-dose',
        `${medication.id}-${scheduledForIso}`,
      );

      const baseDose = {
        id: doseId,
        medicationOrderId: medication.id,
        medicationName: medication.medicationName,
        dose: medication.dose,
        route: medication.route as MedicationRoute,
        scheduledFor: scheduledForIso,
      };

      if (!execution) {
        doses.push({
          ...baseDose,
          status: 'pending' satisfies ResidentShiftDoseStatus,
        });
        continue;
      }

      doses.push({
        ...baseDose,
        status: execution.result satisfies ResidentShiftDoseStatus,
        executionId: execution.id,
        occurredAt: execution.occurredAt,
        actor: execution.audit.createdBy,
      });
    }
  }

  doses.sort(
    (left, right) =>
      new Date(left.scheduledFor).getTime() -
      new Date(right.scheduledFor).getTime(),
  );

  return {
    shift: shiftWindow.shift,
    shiftStartedAt: toIsoDateString(shiftWindow.shiftStartedAt),
    shiftEndsAt: toIsoDateString(shiftWindow.shiftEndsAt),
    generatedAt: toIsoDateString(referenceDate),
    doses,
  };
}

function buildShiftScheduledDoses(
  medication: MedicationOrder,
  shiftWindow: ShiftWindow,
): Date[] {
  const candidateDays = [
    startOfFacilityDay(shiftWindow.shiftStartedAt),
    startOfFacilityDay(shiftWindow.shiftEndsAt),
  ];
  const unique = new Map<number, Date>();

  for (const day of candidateDays) {
    for (const scheduleTime of medication.scheduleTimes) {
      const candidate = mergeDateAndTime(day, scheduleTime);
      if (!candidate) continue;
      const time = candidate.getTime();
      if (
        time < shiftWindow.shiftStartedAt.getTime() ||
        time > shiftWindow.shiftEndsAt.getTime() ||
        !isMedicationActive(medication, toIsoDateString(candidate))
      ) {
        continue;
      }
      unique.set(time, candidate);
    }
  }

  return [...unique.values()].sort(
    (left, right) => left.getTime() - right.getTime(),
  );
}

function assignExecutionsToScheduledDoses(
  scheduledDoses: Date[],
  availableExecutions: MedicationExecution[],
): Map<number, MedicationExecution> {
  const matches = new Map<number, MedicationExecution>();
  const unmatched = [...scheduledDoses];

  for (const execution of availableExecutions) {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < unmatched.length; index += 1) {
      const scheduledFor = unmatched[index];
      const distance = Math.abs(
        new Date(execution.occurredAt).getTime() - scheduledFor.getTime(),
      );
      if (
        distance <= medicationExecutionMatchWindowMs &&
        distance < bestDistance
      ) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    if (bestIndex === -1) continue;
    const [matched] = unmatched.splice(bestIndex, 1);
    if (matched) matches.set(matched.getTime(), execution);
  }

  return matches;
}

function resolveShiftWindow(referenceDate: Date): ShiftWindow {
  const parts = toFacilityDateParts(referenceDate);
  const hour = parts.hours;

  if (hour >= 6 && hour < 14) {
    return {
      shift: 'morning',
      shiftStartedAt: buildFacilityDate(parts, 6, 0, 0, 0),
      shiftEndsAt: buildFacilityDate(parts, 13, 59, 59, 999),
    };
  }
  if (hour >= 14 && hour < 22) {
    return {
      shift: 'afternoon',
      shiftStartedAt: buildFacilityDate(parts, 14, 0, 0, 0),
      shiftEndsAt: buildFacilityDate(parts, 21, 59, 59, 999),
    };
  }
  if (hour >= 22) {
    return {
      shift: 'night',
      shiftStartedAt: buildFacilityDate(parts, 22, 0, 0, 0),
      shiftEndsAt: buildFacilityDate(addFacilityDays(parts, 1), 5, 59, 59, 999),
    };
  }
  return {
    shift: 'night',
    shiftStartedAt: buildFacilityDate(
      addFacilityDays(parts, -1),
      22,
      0,
      0,
      0,
    ),
    shiftEndsAt: buildFacilityDate(parts, 5, 59, 59, 999),
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

function startOfFacilityDay(value: Date): Date {
  return buildFacilityDate(toFacilityDateParts(value), 0, 0, 0, 0);
}

interface FacilityDateParts {
  year: number;
  monthIndex: number;
  day: number;
  hours: number;
  minutes: number;
}

function buildFacilityDate(
  base: FacilityDateParts,
  hours: number,
  minutes: number,
  seconds: number,
  ms: number,
): Date {
  return new Date(
    Date.UTC(base.year, base.monthIndex, base.day, hours, minutes, seconds, ms) -
      facilityUtcOffsetMinutes * 60_000,
  );
}

function addFacilityDays(
  value: FacilityDateParts,
  days: number,
): FacilityDateParts {
  const shifted = new Date(
    Date.UTC(value.year, value.monthIndex, value.day + days, 12, 0, 0, 0),
  );
  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hours: value.hours,
    minutes: value.minutes,
  };
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
