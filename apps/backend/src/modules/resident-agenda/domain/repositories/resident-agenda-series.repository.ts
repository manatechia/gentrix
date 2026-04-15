import type {
  EntityId,
  ResidentAgendaOccurrenceOverrideInput,
  ResidentAgendaSeries,
  ResidentAgendaSeriesCreateInput,
  ResidentAgendaSeriesUpdateInput,
} from '@gentrix/shared-types';

import type { SeriesExceptionRecord } from '../occurrence-expansion';

/**
 * Repositorio de series recurrentes de la agenda. Las series son reglas;
 * las ocurrencias concretas se calculan al listar. Las excepciones persisten
 * como registros separados (skip u override por fecha).
 */
export interface ResidentAgendaSeriesRepository {
  /** Series activas de un residente. Excluye soft-deleted. */
  listActiveByResidentId(
    residentId: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentAgendaSeries[]>;

  /** Series activas de toda la organización. */
  listActiveByOrganization(
    organizationId: EntityId,
  ): Promise<ResidentAgendaSeries[]>;

  /** Excepciones de las series dadas en un rango de fechas (YYYY-MM-DD). */
  listExceptionsForSeries(
    seriesIds: EntityId[],
    fromDate: string,
    toDate: string,
  ): Promise<SeriesExceptionRecord[]>;

  findSeriesById(
    seriesId: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentAgendaSeries | null>;

  createSeries(
    residentId: EntityId,
    input: ResidentAgendaSeriesCreateInput,
    actor: string,
  ): Promise<ResidentAgendaSeries>;

  updateSeries(
    seriesId: EntityId,
    input: ResidentAgendaSeriesUpdateInput,
    actor: string,
    organizationId: EntityId,
  ): Promise<ResidentAgendaSeries>;

  /** Soft-delete. Las excepciones quedan pero dejan de rendirse al filtrar por series activas. */
  softDeleteSeries(
    seriesId: EntityId,
    actor: string,
    organizationId: EntityId,
  ): Promise<void>;

  /** Crea o actualiza la excepción `skip` para la fecha. */
  skipOccurrence(
    seriesId: EntityId,
    occurrenceDate: string,
    actor: string,
  ): Promise<SeriesExceptionRecord>;

  /** Crea o actualiza la excepción `override` para la fecha. */
  overrideOccurrence(
    seriesId: EntityId,
    occurrenceDate: string,
    input: ResidentAgendaOccurrenceOverrideInput,
    actor: string,
  ): Promise<SeriesExceptionRecord>;

  /** Elimina la excepción (restaura la ocurrencia original). */
  clearException(
    seriesId: EntityId,
    occurrenceDate: string,
  ): Promise<void>;

  /** TZ de la organización, o 'UTC' si no está configurada. */
  getOrganizationTimezone(organizationId: EntityId): Promise<string>;
}

export const RESIDENT_AGENDA_SERIES_REPOSITORY = Symbol(
  'RESIDENT_AGENDA_SERIES_REPOSITORY',
);
