import { describe, expect, it } from 'vitest';

import type {
  ResidentAgendaEvent,
  ResidentAgendaSeries,
} from '@gentrix/shared-types';

import {
  expandOccurrencesForDay,
  type SeriesExceptionRecord,
} from './occurrence-expansion';

const TZ = 'America/Argentina/Buenos_Aires';
const audit = {
  createdAt: '2026-04-15T00:00:00.000Z',
  updatedAt: '2026-04-15T00:00:00.000Z',
  createdBy: 'seed',
  updatedBy: 'seed',
};

function buildSeries(
  overrides: Partial<ResidentAgendaSeries> = {},
): ResidentAgendaSeries {
  return {
    id: 'series-1' as ResidentAgendaSeries['id'],
    residentId: 'resident-1' as ResidentAgendaSeries['residentId'],
    title: 'Dar pastilla',
    description: 'Con agua',
    recurrenceType: 'daily',
    recurrenceDaysOfWeek: [],
    timeOfDay: '10:00',
    startsOn: '2026-04-01',
    endsOn: undefined,
    audit,
    ...overrides,
  };
}

function buildEvent(
  overrides: Partial<ResidentAgendaEvent> = {},
): ResidentAgendaEvent {
  return {
    id: 'event-1' as ResidentAgendaEvent['id'],
    residentId: 'resident-1' as ResidentAgendaEvent['residentId'],
    title: 'Turno medico',
    description: undefined,
    scheduledAt: '2026-04-15T14:00:00.000-03:00',
    audit,
    ...overrides,
  };
}

describe('expandOccurrencesForDay', () => {
  const wednesday = new Date('2026-04-15T13:00:00.000Z'); // mie 15/04 10:00 ART

  it('expande una serie diaria a la hora local', () => {
    const occurrences = expandOccurrencesForDay({
      day: wednesday,
      timezone: TZ,
      series: [buildSeries()],
      exceptions: [],
      events: [],
    });
    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].sourceType).toBe('series');
    expect(occurrences[0].title).toBe('Dar pastilla');
    // 10:00 ART = 13:00 UTC
    expect(occurrences[0].scheduledAt).toBe('2026-04-15T13:00:00.000Z');
  });

  it('respeta startsOn y endsOn', () => {
    const future = new Date('2026-03-31T13:00:00.000Z');
    const past = new Date('2026-05-02T13:00:00.000Z');
    const seriesWithEnd = buildSeries({
      startsOn: '2026-04-01',
      endsOn: '2026-05-01',
    });
    expect(
      expandOccurrencesForDay({
        day: future,
        timezone: TZ,
        series: [seriesWithEnd],
        exceptions: [],
        events: [],
      }),
    ).toHaveLength(0);
    expect(
      expandOccurrencesForDay({
        day: past,
        timezone: TZ,
        series: [seriesWithEnd],
        exceptions: [],
        events: [],
      }),
    ).toHaveLength(0);
  });

  it('weekly solo matchea los dias declarados', () => {
    const weeklySeries = buildSeries({
      recurrenceType: 'weekly',
      recurrenceDaysOfWeek: [1, 3, 5], // lun/mie/vie
    });
    // mie 15/04 10:00 ART
    const occurrencesWed = expandOccurrencesForDay({
      day: wednesday,
      timezone: TZ,
      series: [weeklySeries],
      exceptions: [],
      events: [],
    });
    expect(occurrencesWed).toHaveLength(1);

    const tuesday = new Date('2026-04-14T13:00:00.000Z');
    const occurrencesTue = expandOccurrencesForDay({
      day: tuesday,
      timezone: TZ,
      series: [weeklySeries],
      exceptions: [],
      events: [],
    });
    expect(occurrencesTue).toHaveLength(0);
  });

  it('monthly respeta el dia del startsOn y saltea meses sin ese dia', () => {
    const monthlyOn31 = buildSeries({
      recurrenceType: 'monthly',
      startsOn: '2026-01-31',
    });
    const march31 = new Date('2026-03-31T13:00:00.000Z');
    const february = new Date('2026-02-28T13:00:00.000Z');
    expect(
      expandOccurrencesForDay({
        day: march31,
        timezone: TZ,
        series: [monthlyOn31],
        exceptions: [],
        events: [],
      }),
    ).toHaveLength(1);
    expect(
      expandOccurrencesForDay({
        day: february,
        timezone: TZ,
        series: [monthlyOn31],
        exceptions: [],
        events: [],
      }),
    ).toHaveLength(0);
  });

  it('yearly saltea 29/feb en anos no bisiestos', () => {
    const yearlyLeap = buildSeries({
      recurrenceType: 'yearly',
      startsOn: '2024-02-29',
    });
    const feb28NonLeap = new Date('2026-02-28T13:00:00.000Z');
    expect(
      expandOccurrencesForDay({
        day: feb28NonLeap,
        timezone: TZ,
        series: [yearlyLeap],
        exceptions: [],
        events: [],
      }),
    ).toHaveLength(0);
  });

  it('skip exception elimina la ocurrencia ese dia solamente', () => {
    const series = buildSeries();
    const exception: SeriesExceptionRecord = {
      id: 'exc-1' as SeriesExceptionRecord['id'],
      seriesId: series.id,
      occurrenceDate: '2026-04-15',
      action: 'skip',
    };
    expect(
      expandOccurrencesForDay({
        day: wednesday,
        timezone: TZ,
        series: [series],
        exceptions: [exception],
        events: [],
      }),
    ).toHaveLength(0);
    // otro dia no afectado
    expect(
      expandOccurrencesForDay({
        day: new Date('2026-04-16T13:00:00.000Z'),
        timezone: TZ,
        series: [series],
        exceptions: [exception],
        events: [],
      }),
    ).toHaveLength(1);
  });

  it('override reemplaza titulo/descripcion y opcionalmente scheduledAt', () => {
    const series = buildSeries();
    const exception: SeriesExceptionRecord = {
      id: 'exc-1' as SeriesExceptionRecord['id'],
      seriesId: series.id,
      occurrenceDate: '2026-04-15',
      action: 'override',
      overrideTitle: 'Dar pastilla (dosis reforzada)',
      overrideDescription: 'El medico indico tomar dos hoy',
      overrideScheduledAt: '2026-04-15T15:30:00.000Z',
    };
    const out = expandOccurrencesForDay({
      day: wednesday,
      timezone: TZ,
      series: [series],
      exceptions: [exception],
      events: [],
    });
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('Dar pastilla (dosis reforzada)');
    expect(out[0].description).toBe('El medico indico tomar dos hoy');
    expect(out[0].scheduledAt).toBe('2026-04-15T15:30:00.000Z');
    expect(out[0].isOverride).toBe(true);
    expect(out[0].exceptionId).toBe('exc-1');
  });

  it('mezcla eventos one-off con series y ordena cronologicamente', () => {
    const series = buildSeries({ timeOfDay: '20:00' }); // 20:00 ART = 23:00 UTC
    const event = buildEvent({ scheduledAt: '2026-04-15T15:00:00.000Z' }); // 12:00 ART
    const out = expandOccurrencesForDay({
      day: wednesday,
      timezone: TZ,
      series: [series],
      exceptions: [],
      events: [event],
    });
    expect(out).toHaveLength(2);
    expect(out[0].sourceType).toBe('event');
    expect(out[1].sourceType).toBe('series');
  });

  it('descarta eventos one-off fuera del dia local', () => {
    const yesterday = buildEvent({
      id: 'event-yesterday' as ResidentAgendaEvent['id'],
      scheduledAt: '2026-04-14T22:00:00.000Z',
    });
    const tomorrow = buildEvent({
      id: 'event-tomorrow' as ResidentAgendaEvent['id'],
      scheduledAt: '2026-04-16T05:00:00.000Z',
    });
    const today = buildEvent({
      id: 'event-today' as ResidentAgendaEvent['id'],
      scheduledAt: '2026-04-15T15:00:00.000Z',
    });
    const out = expandOccurrencesForDay({
      day: wednesday,
      timezone: TZ,
      series: [],
      exceptions: [],
      events: [yesterday, tomorrow, today],
    });
    expect(out.map((o) => o.sourceId)).toEqual(['event-today']);
  });
});
