import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createResidentSeed, type Resident } from '@gentrix/domain-residents';
import type {
  EntityId,
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaEventWithResident,
  ResidentAgendaOccurrenceOverrideInput,
  ResidentAgendaSeries,
  ResidentAgendaSeriesCreateInput,
  ResidentAgendaSeriesUpdateInput,
} from '@gentrix/shared-types';

import { silentPinoLogger } from '../../../common/logger/testing';
import type { SeriesExceptionRecord } from '../domain/occurrence-expansion';
import type { ResidentAgendaRepository } from '../domain/repositories/resident-agenda.repository';
import type { ResidentAgendaSeriesRepository } from '../domain/repositories/resident-agenda-series.repository';
import type { ResidentsService } from '../../residents/application/residents.service';
import { ResidentAgendaService } from './resident-agenda.service';

const FIXED_NOW = new Date('2026-04-15T10:00:00.000Z');
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

class ResidentAgendaRepositoryStub implements ResidentAgendaRepository {
  public stored: ResidentAgendaEvent[] = [];
  public lastCreate: {
    residentId: string;
    input: ResidentAgendaEventCreateInput;
    actor: string;
  } | null = null;
  public lastUpdate: {
    eventId: string;
    input: ResidentAgendaEventUpdateInput;
    actor: string;
  } | null = null;
  public lastDelete: { eventId: string; actor: string } | null = null;

  async listUpcomingByResidentId(
    residentId: EntityId,
    now: Date,
  ): Promise<ResidentAgendaEvent[]> {
    return this.stored
      .filter(
        (event) =>
          event.residentId === residentId &&
          new Date(event.scheduledAt).getTime() >= now.getTime(),
      )
      .sort(
        (l, r) =>
          new Date(l.scheduledAt).getTime() - new Date(r.scheduledAt).getTime(),
      );
  }

  async listByResidentInRange(
    residentId: EntityId,
    from: Date,
    to: Date,
  ): Promise<ResidentAgendaEvent[]> {
    return this.stored.filter((event) => {
      const ms = new Date(event.scheduledAt).getTime();
      return (
        event.residentId === residentId &&
        ms >= from.getTime() &&
        ms < to.getTime()
      );
    });
  }

  async listByOrganizationInRange(): Promise<
    ResidentAgendaEventWithResident[]
  > {
    return [];
  }

  async listUpcomingByOrganization(): Promise<ResidentAgendaEventWithResident[]> {
    return [];
  }

  async findById(eventId: EntityId): Promise<ResidentAgendaEvent | null> {
    return this.stored.find((e) => e.id === eventId) ?? null;
  }

  async create(
    residentId: EntityId,
    input: ResidentAgendaEventCreateInput,
    actor: string,
  ): Promise<ResidentAgendaEvent> {
    this.lastCreate = { residentId, input: { ...input }, actor };
    const now = FIXED_NOW.toISOString();
    const created: ResidentAgendaEvent = {
      id: 'event-001' as ResidentAgendaEvent['id'],
      residentId,
      title: input.title,
      description: input.description,
      scheduledAt: input.scheduledAt,
      audit: { createdAt: now, updatedAt: now, createdBy: actor, updatedBy: actor },
    };
    this.stored.push(created);
    return created;
  }

  async update(
    eventId: EntityId,
    input: ResidentAgendaEventUpdateInput,
    actor: string,
  ): Promise<ResidentAgendaEvent> {
    this.lastUpdate = { eventId, input: { ...input }, actor };
    const idx = this.stored.findIndex((e) => e.id === eventId);
    const current = this.stored[idx];
    const updated: ResidentAgendaEvent = {
      ...current,
      title: input.title,
      description: input.description,
      scheduledAt: input.scheduledAt,
      audit: { ...current.audit, updatedAt: FIXED_NOW.toISOString(), updatedBy: actor },
    };
    this.stored.splice(idx, 1, updated);
    return updated;
  }

  async softDelete(eventId: EntityId, actor: string): Promise<void> {
    this.lastDelete = { eventId, actor };
    this.stored = this.stored.filter((e) => e.id !== eventId);
  }
}

class SeriesRepositoryStub implements ResidentAgendaSeriesRepository {
  public series: ResidentAgendaSeries[] = [];
  public exceptions: SeriesExceptionRecord[] = [];
  public tz = 'America/Argentina/Buenos_Aires';
  public lastCreate: {
    residentId: EntityId;
    input: ResidentAgendaSeriesCreateInput;
    actor: string;
  } | null = null;
  public lastSkip: {
    seriesId: EntityId;
    occurrenceDate: string;
    actor: string;
  } | null = null;

  async listActiveByResidentId(
    residentId: EntityId,
  ): Promise<ResidentAgendaSeries[]> {
    return this.series.filter((s) => s.residentId === residentId);
  }
  async listActiveByOrganization(): Promise<ResidentAgendaSeries[]> {
    return this.series;
  }
  async listExceptionsForSeries(
    seriesIds: EntityId[],
  ): Promise<SeriesExceptionRecord[]> {
    return this.exceptions.filter((e) => seriesIds.includes(e.seriesId));
  }
  async findSeriesById(seriesId: EntityId): Promise<ResidentAgendaSeries | null> {
    return this.series.find((s) => s.id === seriesId) ?? null;
  }
  async createSeries(
    residentId: EntityId,
    input: ResidentAgendaSeriesCreateInput,
    actor: string,
  ): Promise<ResidentAgendaSeries> {
    this.lastCreate = { residentId, input: { ...input }, actor };
    const now = FIXED_NOW.toISOString();
    const created: ResidentAgendaSeries = {
      id: 'series-001' as ResidentAgendaSeries['id'],
      residentId,
      title: input.title,
      description: input.description,
      recurrenceType: input.recurrenceType,
      recurrenceDaysOfWeek: input.recurrenceDaysOfWeek ?? [],
      timeOfDay: input.timeOfDay,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      audit: { createdAt: now, updatedAt: now, createdBy: actor, updatedBy: actor },
    };
    this.series.push(created);
    return created;
  }
  async updateSeries(
    seriesId: EntityId,
    input: ResidentAgendaSeriesUpdateInput,
    actor: string,
  ): Promise<ResidentAgendaSeries> {
    const idx = this.series.findIndex((s) => s.id === seriesId);
    const current = this.series[idx];
    const updated: ResidentAgendaSeries = {
      ...current,
      title: input.title,
      description: input.description,
      recurrenceType: input.recurrenceType,
      recurrenceDaysOfWeek: input.recurrenceDaysOfWeek ?? [],
      timeOfDay: input.timeOfDay,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      audit: { ...current.audit, updatedAt: FIXED_NOW.toISOString(), updatedBy: actor },
    };
    this.series.splice(idx, 1, updated);
    return updated;
  }
  async softDeleteSeries(seriesId: EntityId): Promise<void> {
    this.series = this.series.filter((s) => s.id !== seriesId);
  }
  async skipOccurrence(
    seriesId: EntityId,
    occurrenceDate: string,
    actor: string,
  ): Promise<SeriesExceptionRecord> {
    this.lastSkip = { seriesId, occurrenceDate, actor };
    const exc: SeriesExceptionRecord = {
      id: 'exc-1' as SeriesExceptionRecord['id'],
      seriesId,
      occurrenceDate,
      action: 'skip',
    };
    this.exceptions.push(exc);
    return exc;
  }
  async overrideOccurrence(
    seriesId: EntityId,
    occurrenceDate: string,
    input: ResidentAgendaOccurrenceOverrideInput,
  ): Promise<SeriesExceptionRecord> {
    const exc: SeriesExceptionRecord = {
      id: 'exc-2' as SeriesExceptionRecord['id'],
      seriesId,
      occurrenceDate,
      action: 'override',
      overrideTitle: input.title,
      overrideDescription: input.description ?? null,
      overrideScheduledAt: input.overrideScheduledAt ?? null,
    };
    this.exceptions.push(exc);
    return exc;
  }
  async clearException(
    seriesId: EntityId,
    occurrenceDate: string,
  ): Promise<void> {
    this.exceptions = this.exceptions.filter(
      (e) => !(e.seriesId === seriesId && e.occurrenceDate === occurrenceDate),
    );
  }
  async getOrganizationTimezone(): Promise<string> {
    return this.tz;
  }
}

class ResidentsServiceStub {
  public resident: Resident = createResidentSeed();
  public touchedAudit:
    | { residentId: string; actor: string; organizationId?: string }
    | null = null;
  async getResidentEntityById(): Promise<Resident> {
    return this.resident;
  }
  async touchResidentAudit(
    residentId: string,
    actor: string,
    organizationId?: string,
  ): Promise<void> {
    this.touchedAudit = { residentId, actor, organizationId };
  }
  async getResidentEntities(): Promise<Resident[]> {
    return [this.resident];
  }
}

function buildEventInput(
  overrides: Partial<ResidentAgendaEventCreateInput> = {},
): ResidentAgendaEventCreateInput {
  return {
    title: 'Turno medico',
    description: 'Preparar historia clinica',
    scheduledAt: new Date(FIXED_NOW.getTime() + ONE_DAY_MS).toISOString(),
    ...overrides,
  };
}

function buildSeriesInput(
  overrides: Partial<ResidentAgendaSeriesCreateInput> = {},
): ResidentAgendaSeriesCreateInput {
  return {
    title: 'Dar pastilla',
    description: 'Con agua',
    recurrenceType: 'daily',
    recurrenceDaysOfWeek: [],
    timeOfDay: '10:00',
    startsOn: '2026-04-15',
    ...overrides,
  };
}

function buildService(): {
  service: ResidentAgendaService;
  agendaRepo: ResidentAgendaRepositoryStub;
  seriesRepo: SeriesRepositoryStub;
  residents: ResidentsServiceStub;
} {
  const agendaRepo = new ResidentAgendaRepositoryStub();
  const seriesRepo = new SeriesRepositoryStub();
  const residents = new ResidentsServiceStub();
  const service = new ResidentAgendaService(
    agendaRepo,
    seriesRepo,
    residents as unknown as ResidentsService,
    silentPinoLogger(),
  );
  return { service, agendaRepo, seriesRepo, residents };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

describe('ResidentAgendaService.createEvent', () => {
  it('crea un evento one-off futuro y toca auditoria', async () => {
    const { service, agendaRepo, residents } = buildService();
    const created = await service.createEvent(
      residents.resident.id,
      buildEventInput(),
      'Sofia',
    );
    expect(created.id).toBe('event-001');
    expect(agendaRepo.lastCreate?.actor).toBe('Sofia');
    expect(residents.touchedAudit?.residentId).toBe(residents.resident.id);
  });

  it('rechaza eventos en el pasado', async () => {
    const { service, residents } = buildService();
    await expect(
      service.createEvent(
        residents.resident.id,
        buildEventInput({
          scheduledAt: new Date(FIXED_NOW.getTime() - ONE_HOUR_MS).toISOString(),
        }),
        'Sofia',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ResidentAgendaService.createSeries', () => {
  it('crea una serie diaria valida', async () => {
    const { service, seriesRepo, residents } = buildService();
    const created = await service.createSeries(
      residents.resident.id,
      buildSeriesInput(),
      'Sofia',
    );
    expect(created.recurrenceType).toBe('daily');
    expect(seriesRepo.lastCreate?.actor).toBe('Sofia');
    expect(residents.touchedAudit?.residentId).toBe(residents.resident.id);
  });

  it('rechaza weekly sin dias', async () => {
    const { service, residents } = buildService();
    await expect(
      service.createSeries(
        residents.resident.id,
        buildSeriesInput({ recurrenceType: 'weekly', recurrenceDaysOfWeek: [] }),
        'Sofia',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza timeOfDay invalida', async () => {
    const { service, residents } = buildService();
    await expect(
      service.createSeries(
        residents.resident.id,
        buildSeriesInput({ timeOfDay: '25:99' }),
        'Sofia',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza endsOn anterior a startsOn', async () => {
    const { service, residents } = buildService();
    await expect(
      service.createSeries(
        residents.resident.id,
        buildSeriesInput({ startsOn: '2026-04-15', endsOn: '2026-04-01' }),
        'Sofia',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ResidentAgendaService.skipOccurrence / overrideOccurrence', () => {
  it('skip crea una excepcion para la fecha dada', async () => {
    const { service, seriesRepo, residents } = buildService();
    await service.createSeries(
      residents.resident.id,
      buildSeriesInput(),
      'Sofia',
    );
    const exception = await service.skipOccurrence(
      residents.resident.id,
      'series-001',
      '2026-04-15',
      'Sofia',
    );
    expect(exception.action).toBe('skip');
    expect(seriesRepo.lastSkip?.occurrenceDate).toBe('2026-04-15');
  });

  it('override requiere titulo', async () => {
    const { service, residents } = buildService();
    await service.createSeries(
      residents.resident.id,
      buildSeriesInput(),
      'Sofia',
    );
    await expect(
      service.overrideOccurrence(
        residents.resident.id,
        'series-001',
        '2026-04-15',
        { title: '   ' },
        'Sofia',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ResidentAgendaService.listOccurrencesForResidentToday', () => {
  it('expande la serie + incluye eventos del dia', async () => {
    const { service, residents } = buildService();
    // sembrar una serie diaria a las 10:00 ART
    await service.createSeries(
      residents.resident.id,
      buildSeriesInput({ timeOfDay: '10:00', startsOn: '2026-04-14' }),
      'Sofia',
    );
    // sembrar un evento one-off del dia a las 15:00 ART (18:00 UTC)
    await service.createEvent(
      residents.resident.id,
      buildEventInput({ scheduledAt: '2026-04-15T18:00:00.000Z' }),
      'Sofia',
    );
    const occurrences = await service.listOccurrencesForResidentToday(
      residents.resident.id,
    );
    expect(occurrences).toHaveLength(2);
    expect(occurrences[0].sourceType).toBe('series'); // 10:00 ART = 13:00 UTC
    expect(occurrences[1].sourceType).toBe('event');
  });
});

describe('ResidentAgendaService - ownership checks', () => {
  it('rechaza editar un evento que no pertenece al residente', async () => {
    const { service, agendaRepo: repo, residents } = buildService();
    repo.stored.push({
      id: 'otra' as ResidentAgendaEvent['id'],
      residentId: 'otro-residente' as ResidentAgendaEvent['residentId'],
      title: 'x',
      description: undefined,
      scheduledAt: new Date(FIXED_NOW.getTime() + ONE_HOUR_MS).toISOString(),
      audit: {
        createdAt: FIXED_NOW.toISOString(),
        updatedAt: FIXED_NOW.toISOString(),
        createdBy: 'seed',
        updatedBy: 'seed',
      },
    });
    await expect(
      service.updateEvent(
        residents.resident.id,
        'otra',
        {
          title: 'hack',
          scheduledAt: new Date(FIXED_NOW.getTime() + ONE_HOUR_MS).toISOString(),
        },
        'Sofia',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('NotFound cuando el evento no existe', async () => {
    const { service, residents } = buildService();
    await expect(
      service.deleteEvent(residents.resident.id, 'nope', 'Sofia'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
