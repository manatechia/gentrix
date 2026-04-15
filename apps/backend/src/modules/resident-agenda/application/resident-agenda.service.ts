import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  EntityId,
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaOccurrence,
  ResidentAgendaOccurrenceOverrideInput,
  ResidentAgendaOccurrenceWithResident,
  ResidentAgendaRecurrenceType,
  ResidentAgendaSeries,
  ResidentAgendaSeriesCreateInput,
  ResidentAgendaSeriesUpdateInput,
} from '@gentrix/shared-types';
import { endOfLocalDay, startOfLocalDay } from '@gentrix/shared-utils';

import { ResidentsService } from '../../residents/application/residents.service';
import {
  expandOccurrencesForDay,
  type SeriesExceptionRecord,
} from '../domain/occurrence-expansion';
import {
  RESIDENT_AGENDA_REPOSITORY,
  type ResidentAgendaRepository,
} from '../domain/repositories/resident-agenda.repository';
import {
  RESIDENT_AGENDA_SERIES_REPOSITORY,
  type ResidentAgendaSeriesRepository,
} from '../domain/repositories/resident-agenda-series.repository';

const RECURRENCE_TYPES: readonly ResidentAgendaRecurrenceType[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
];
const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class ResidentAgendaService {
  constructor(
    @Inject(RESIDENT_AGENDA_REPOSITORY)
    private readonly agendaRepository: ResidentAgendaRepository,
    @Inject(RESIDENT_AGENDA_SERIES_REPOSITORY)
    private readonly seriesRepository: ResidentAgendaSeriesRepository,
    @Inject(ResidentsService)
    private readonly residentsService: ResidentsService,
  ) {}

  /**
   * Ocurrencias del día actual para un residente. Mezcla eventos one-off del
   * día con las series expandidas (descontando skips y aplicando overrides).
   */
  async listOccurrencesForResidentToday(
    residentId: string,
    organizationId?: string,
  ): Promise<ResidentAgendaOccurrence[]> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const timezone = await this.seriesRepository.getOrganizationTimezone(
      resident.organizationId,
    );
    const now = new Date();
    const dayStart = startOfLocalDay(now, timezone);
    const dayEnd = endOfLocalDay(now, timezone);

    const [series, events] = await Promise.all([
      this.seriesRepository.listActiveByResidentId(
        resident.id,
        resident.organizationId,
      ),
      this.agendaRepository.listByResidentInRange(
        resident.id,
        dayStart,
        dayEnd,
        resident.organizationId,
      ),
    ]);

    const exceptions = await this.loadExceptionsForDay(series, dayStart, timezone);

    return expandOccurrencesForDay({
      day: now,
      timezone,
      series,
      exceptions,
      events,
    });
  }

  /** Ocurrencias del día a nivel organización, enriquecidas con nombre/habitación del residente. */
  async listOccurrencesForOrganizationToday(
    organizationId: EntityId,
  ): Promise<ResidentAgendaOccurrenceWithResident[]> {
    const timezone =
      await this.seriesRepository.getOrganizationTimezone(organizationId);
    const now = new Date();
    const dayStart = startOfLocalDay(now, timezone);
    const dayEnd = endOfLocalDay(now, timezone);

    const [allSeries, eventsWithResident] = await Promise.all([
      this.seriesRepository.listActiveByOrganization(organizationId),
      this.agendaRepository.listByOrganizationInRange(
        organizationId,
        dayStart,
        dayEnd,
      ),
    ]);
    const exceptions = await this.loadExceptionsForDay(
      allSeries,
      dayStart,
      timezone,
    );

    // Agrupo series por residente y armo un lookup {residentId -> {fullName, room}}
    // a partir de los eventos del día (si existen) o de una query de residentes.
    const residentMeta = new Map<string, { fullName: string; room: string }>();
    for (const event of eventsWithResident) {
      residentMeta.set(event.residentId, {
        fullName: event.residentFullName,
        room: event.residentRoom,
      });
    }
    const missingResidentIds = Array.from(
      new Set(
        allSeries
          .map((series) => series.residentId)
          .filter((id) => !residentMeta.has(id)),
      ),
    );
    if (missingResidentIds.length > 0) {
      const overviews = await this.residentsService.getResidentEntities(
        organizationId,
      );
      for (const resident of overviews) {
        if (!residentMeta.has(resident.id)) {
          const fullName =
            `${resident.firstName} ${resident.lastName}`.trim();
          residentMeta.set(resident.id, {
            fullName,
            room: resident.room,
          });
        }
      }
    }

    const occurrences = expandOccurrencesForDay({
      day: now,
      timezone,
      series: allSeries,
      exceptions,
      events: eventsWithResident,
    });

    return occurrences.map((occurrence) => {
      const meta = residentMeta.get(occurrence.residentId);
      return {
        ...occurrence,
        residentFullName: meta?.fullName ?? 'Residente',
        residentRoom: meta?.room ?? '—',
      };
    });
  }

  // --------- Eventos one-off (API original, compat con PR #10) ----------

  async createEvent(
    residentId: string,
    input: ResidentAgendaEventCreateInput,
    actor: string,
    organizationId?: string,
  ): Promise<ResidentAgendaEvent> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const normalized = this.validateAndNormalizeEvent(input);
    const created = await this.agendaRepository.create(
      resident.id,
      normalized,
      actor,
    );
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
    return created;
  }

  async updateEvent(
    residentId: string,
    eventId: string,
    input: ResidentAgendaEventUpdateInput,
    actor: string,
    organizationId?: string,
  ): Promise<ResidentAgendaEvent> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const existing = await this.getOwnedEvent(
      eventId,
      resident.id,
      resident.organizationId,
    );
    if (new Date(existing.scheduledAt).getTime() <= Date.now()) {
      throw new BadRequestException(
        'No se puede editar un evento de agenda que ya ocurrió.',
      );
    }
    const normalized = this.validateAndNormalizeEvent(input);
    const updated = await this.agendaRepository.update(
      existing.id,
      normalized,
      actor,
      resident.organizationId,
    );
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
    return updated;
  }

  async deleteEvent(
    residentId: string,
    eventId: string,
    actor: string,
    organizationId?: string,
  ): Promise<void> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const existing = await this.getOwnedEvent(
      eventId,
      resident.id,
      resident.organizationId,
    );
    await this.agendaRepository.softDelete(
      existing.id,
      actor,
      resident.organizationId,
    );
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
  }

  // --------------------------- Series ---------------------------

  async createSeries(
    residentId: string,
    input: ResidentAgendaSeriesCreateInput,
    actor: string,
    organizationId?: string,
  ): Promise<ResidentAgendaSeries> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const normalized = this.validateAndNormalizeSeries(input);
    const created = await this.seriesRepository.createSeries(
      resident.id,
      normalized,
      actor,
    );
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
    return created;
  }

  async updateSeries(
    residentId: string,
    seriesId: string,
    input: ResidentAgendaSeriesUpdateInput,
    actor: string,
    organizationId?: string,
  ): Promise<ResidentAgendaSeries> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const existing = await this.getOwnedSeries(
      seriesId,
      resident.id,
      resident.organizationId,
    );
    const normalized = this.validateAndNormalizeSeries(input);
    const updated = await this.seriesRepository.updateSeries(
      existing.id,
      normalized,
      actor,
      resident.organizationId,
    );
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
    return updated;
  }

  async deleteSeries(
    residentId: string,
    seriesId: string,
    actor: string,
    organizationId?: string,
  ): Promise<void> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const existing = await this.getOwnedSeries(
      seriesId,
      resident.id,
      resident.organizationId,
    );
    await this.seriesRepository.softDeleteSeries(
      existing.id,
      actor,
      resident.organizationId,
    );
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
  }

  async skipOccurrence(
    residentId: string,
    seriesId: string,
    occurrenceDate: string,
    actor: string,
    organizationId?: string,
  ): Promise<SeriesExceptionRecord> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const series = await this.getOwnedSeries(
      seriesId,
      resident.id,
      resident.organizationId,
    );
    this.assertYmd(occurrenceDate);
    const exception = await this.seriesRepository.skipOccurrence(
      series.id,
      occurrenceDate,
      actor,
    );
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
    return exception;
  }

  async overrideOccurrence(
    residentId: string,
    seriesId: string,
    occurrenceDate: string,
    input: ResidentAgendaOccurrenceOverrideInput,
    actor: string,
    organizationId?: string,
  ): Promise<SeriesExceptionRecord> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const series = await this.getOwnedSeries(
      seriesId,
      resident.id,
      resident.organizationId,
    );
    this.assertYmd(occurrenceDate);
    if (input.title.trim().length === 0) {
      throw new BadRequestException('El evento debe tener un titulo.');
    }
    const normalized = {
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      overrideScheduledAt: input.overrideScheduledAt
        ? new Date(input.overrideScheduledAt).toISOString()
        : undefined,
    };
    const exception = await this.seriesRepository.overrideOccurrence(
      series.id,
      occurrenceDate,
      normalized,
      actor,
    );
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
    return exception;
  }

  async clearOccurrenceException(
    residentId: string,
    seriesId: string,
    occurrenceDate: string,
    actor: string,
    organizationId?: string,
  ): Promise<void> {
    const resident = await this.residentsService.getResidentEntityById(
      residentId,
      organizationId,
    );
    const series = await this.getOwnedSeries(
      seriesId,
      resident.id,
      resident.organizationId,
    );
    this.assertYmd(occurrenceDate);
    await this.seriesRepository.clearException(series.id, occurrenceDate);
    await this.residentsService.touchResidentAudit(
      resident.id,
      actor,
      resident.organizationId,
    );
  }

  // --------------------------- Helpers ---------------------------

  private async loadExceptionsForDay(
    series: ResidentAgendaSeries[],
    dayStart: Date,
    timezone: string,
  ): Promise<SeriesExceptionRecord[]> {
    if (series.length === 0) return [];
    const ymd = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dayStart);
    const ids = series.map((s) => s.id as EntityId);
    return this.seriesRepository.listExceptionsForSeries(ids, ymd, ymd);
  }

  private async getOwnedEvent(
    eventId: string,
    residentId: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentAgendaEvent> {
    const event = await this.agendaRepository.findById(
      eventId as EntityId,
      organizationId,
    );
    if (!event) {
      throw new NotFoundException('No encontre el evento de agenda.');
    }
    if (event.residentId !== residentId) {
      throw new ForbiddenException(
        'El evento de agenda no pertenece a este residente.',
      );
    }
    return event;
  }

  private async getOwnedSeries(
    seriesId: string,
    residentId: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentAgendaSeries> {
    const series = await this.seriesRepository.findSeriesById(
      seriesId as EntityId,
      organizationId,
    );
    if (!series) {
      throw new NotFoundException('No encontre la serie de agenda.');
    }
    if (series.residentId !== residentId) {
      throw new ForbiddenException(
        'La serie de agenda no pertenece a este residente.',
      );
    }
    return series;
  }

  private validateAndNormalizeEvent<T extends ResidentAgendaEventCreateInput>(
    input: T,
  ): T {
    const title = input.title.trim();
    const description = input.description?.trim();
    const scheduledDate = new Date(input.scheduledAt);

    if (title.length === 0) {
      throw new BadRequestException('El evento debe tener un titulo.');
    }
    if (Number.isNaN(scheduledDate.getTime())) {
      throw new BadRequestException(
        'La fecha y hora del evento no tiene un formato valido.',
      );
    }
    if (scheduledDate.getTime() <= Date.now()) {
      throw new BadRequestException(
        'La fecha y hora del evento debe estar en el futuro.',
      );
    }
    return {
      ...input,
      title,
      description:
        description && description.length > 0 ? description : undefined,
      scheduledAt: scheduledDate.toISOString(),
    };
  }

  private validateAndNormalizeSeries(
    input: ResidentAgendaSeriesCreateInput,
  ): ResidentAgendaSeriesCreateInput {
    const title = input.title.trim();
    if (title.length === 0) {
      throw new BadRequestException('La serie debe tener un titulo.');
    }
    if (!RECURRENCE_TYPES.includes(input.recurrenceType)) {
      throw new BadRequestException('Tipo de recurrencia no valido.');
    }
    if (!TIME_OF_DAY_PATTERN.test(input.timeOfDay)) {
      throw new BadRequestException(
        'La hora debe tener formato HH:mm (24h).',
      );
    }
    const startsOn = input.startsOn.slice(0, 10);
    if (!YMD_PATTERN.test(startsOn)) {
      throw new BadRequestException(
        'La fecha de inicio debe tener formato YYYY-MM-DD.',
      );
    }
    const endsOn = input.endsOn ? input.endsOn.slice(0, 10) : undefined;
    if (endsOn) {
      if (!YMD_PATTERN.test(endsOn)) {
        throw new BadRequestException(
          'La fecha de fin debe tener formato YYYY-MM-DD.',
        );
      }
      if (endsOn < startsOn) {
        throw new BadRequestException(
          'La fecha de fin no puede ser anterior a la de inicio.',
        );
      }
    }
    let daysOfWeek = input.recurrenceDaysOfWeek ?? [];
    if (input.recurrenceType === 'weekly') {
      daysOfWeek = Array.from(new Set(daysOfWeek.filter((n) => n >= 0 && n <= 6))).sort();
      if (daysOfWeek.length === 0) {
        throw new BadRequestException(
          'La recurrencia semanal requiere al menos un dia.',
        );
      }
    } else {
      daysOfWeek = [];
    }
    return {
      title,
      description: input.description?.trim() || undefined,
      recurrenceType: input.recurrenceType,
      recurrenceDaysOfWeek: daysOfWeek,
      timeOfDay: input.timeOfDay,
      startsOn,
      endsOn,
    };
  }

  private assertYmd(value: string): void {
    if (!YMD_PATTERN.test(value)) {
      throw new BadRequestException(
        'La fecha de ocurrencia debe tener formato YYYY-MM-DD.',
      );
    }
  }
}
