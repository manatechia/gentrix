import type {
  EntityId,
  ResidentAgendaEvent,
  ResidentAgendaOccurrence,
  ResidentAgendaRecurrenceType,
  ResidentAgendaSeries,
} from '@gentrix/shared-types';
import {
  endOfLocalDay,
  localDateTimeToUtc,
  startOfLocalDay,
  toIsoDateString,
} from '@gentrix/shared-utils';

/**
 * Datos mínimos de una excepción que consume la expansión. Los repos devuelven
 * este shape proyectado para no acoplar dominio a Prisma.
 */
export interface SeriesExceptionRecord {
  id: EntityId;
  seriesId: EntityId;
  occurrenceDate: string; // YYYY-MM-DD
  action: 'skip' | 'override';
  overrideTitle?: string | null;
  overrideDescription?: string | null;
  overrideScheduledAt?: string | null; // ISO
}

interface ExpandInput {
  day: Date; // instante dentro del día que queremos expandir
  timezone: string; // TZ de la organización
  series: ResidentAgendaSeries[];
  exceptions: SeriesExceptionRecord[];
  events: ResidentAgendaEvent[];
}

/**
 * Expande las reglas de agenda a las ocurrencias concretas de un único día
 * (en la TZ pedida). Mezcla eventos one-off y series con sus excepciones.
 *
 * El resultado está ordenado cronológicamente ascendente. Uso esperado: el
 * endpoint de listado llama a esta función una vez por listado, sin cachear.
 */
export function expandOccurrencesForDay(
  input: ExpandInput,
): ResidentAgendaOccurrence[] {
  const { day, timezone, series, exceptions, events } = input;

  const dayStart = startOfLocalDay(day, timezone);
  const dayEnd = endOfLocalDay(day, timezone);
  const ymd = isoDateOnly(dayStart, timezone);
  const dow = dayOfWeekInZone(dayStart, timezone);
  const dayOfMonth = dayOfMonthInZone(dayStart, timezone);
  const monthOfYear = monthInZone(dayStart, timezone);

  const exceptionBySeriesDate = new Map<string, SeriesExceptionRecord>();
  for (const exception of exceptions) {
    exceptionBySeriesDate.set(
      `${exception.seriesId}|${exception.occurrenceDate}`,
      exception,
    );
  }

  const occurrences: ResidentAgendaOccurrence[] = [];

  for (const rule of series) {
    const startsOnYmd = rule.startsOn.slice(0, 10);
    const endsOnYmd = rule.endsOn ? rule.endsOn.slice(0, 10) : null;
    if (ymd < startsOnYmd) continue;
    if (endsOnYmd && ymd > endsOnYmd) continue;

    if (!seriesMatchesDay(rule, { ymd, dow, dayOfMonth, monthOfYear })) {
      continue;
    }

    const exception = exceptionBySeriesDate.get(`${rule.id}|${ymd}`);
    if (exception?.action === 'skip') continue;

    const baseScheduledAt = localDateTimeToUtc(ymd, rule.timeOfDay, timezone);
    const scheduledAt =
      exception?.action === 'override' && exception.overrideScheduledAt
        ? new Date(exception.overrideScheduledAt)
        : baseScheduledAt;

    const title =
      exception?.action === 'override' && exception.overrideTitle
        ? exception.overrideTitle
        : rule.title;
    const description =
      exception?.action === 'override'
        ? (exception.overrideDescription ?? undefined) || undefined
        : rule.description;

    occurrences.push({
      sourceType: 'series',
      sourceId: rule.id,
      residentId: rule.residentId,
      occurrenceDate: ymd,
      isOverride: exception?.action === 'override' || undefined,
      exceptionId: exception?.id,
      title,
      description,
      scheduledAt: toIsoDateString(scheduledAt),
      recurrence: {
        type: rule.recurrenceType,
        daysOfWeek: rule.recurrenceDaysOfWeek,
        endsOn: rule.endsOn,
        startsOn: rule.startsOn,
        timeOfDay: rule.timeOfDay,
      },
      audit: rule.audit,
    });
  }

  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayEnd.getTime();
  for (const event of events) {
    const eventMs = new Date(event.scheduledAt).getTime();
    if (eventMs < dayStartMs || eventMs >= dayEndMs) continue;
    occurrences.push({
      sourceType: 'event',
      sourceId: event.id,
      residentId: event.residentId,
      title: event.title,
      description: event.description,
      scheduledAt: event.scheduledAt,
      audit: event.audit,
    });
  }

  occurrences.sort(
    (left, right) =>
      new Date(left.scheduledAt).getTime() -
      new Date(right.scheduledAt).getTime(),
  );

  return occurrences;
}

function seriesMatchesDay(
  rule: ResidentAgendaSeries,
  day: { ymd: string; dow: number; dayOfMonth: number; monthOfYear: number },
): boolean {
  const startYmd = rule.startsOn.slice(0, 10);
  switch (rule.recurrenceType as ResidentAgendaRecurrenceType) {
    case 'daily':
      return true;
    case 'weekly':
      return rule.recurrenceDaysOfWeek.includes(day.dow);
    case 'monthly': {
      const startDom = Number.parseInt(startYmd.slice(8, 10), 10);
      return day.dayOfMonth === startDom;
    }
    case 'yearly': {
      const startMonth = Number.parseInt(startYmd.slice(5, 7), 10);
      const startDom = Number.parseInt(startYmd.slice(8, 10), 10);
      return day.monthOfYear === startMonth && day.dayOfMonth === startDom;
    }
    default:
      return false;
  }
}

function isoDateOnly(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(date); // YYYY-MM-DD con en-CA
}

function dayOfWeekInZone(date: Date, timezone: string): number {
  // 'short' weekday en en-US da Sun..Sat
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const abbreviation = fmt.format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[abbreviation] ?? 0;
}

function dayOfMonthInZone(date: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    day: '2-digit',
  });
  return Number.parseInt(fmt.format(date), 10);
}

function monthInZone(date: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: '2-digit',
  });
  return Number.parseInt(fmt.format(date), 10);
}
