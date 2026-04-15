import type {
  EntityId,
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaEventWithResident,
} from '@gentrix/shared-types';

/**
 * Repositorio de la agenda del residente. Todas las consultas filtran por
 * soft-delete y, cuando se provee, por organización (multi-tenant).
 */
export interface ResidentAgendaRepository {
  /**
   * Lista los eventos futuros (scheduledAt >= now) de un residente, ordenados
   * cronológicamente ascendente. Se excluyen eventos soft-deleted.
   */
  listUpcomingByResidentId(
    residentId: EntityId,
    now: Date,
    organizationId?: EntityId,
  ): Promise<ResidentAgendaEvent[]>;

  /**
   * Próximos eventos de toda la organización, con los datos mínimos del
   * residente adjuntos para poder renderizar "Próximas tareas" en el dashboard
   * sin resolver nombres en el cliente.
   */
  listUpcomingByOrganization(
    organizationId: EntityId,
    now: Date,
    limit: number,
  ): Promise<ResidentAgendaEventWithResident[]>;

  findById(
    eventId: EntityId,
    organizationId?: EntityId,
  ): Promise<ResidentAgendaEvent | null>;

  create(
    residentId: EntityId,
    input: ResidentAgendaEventCreateInput,
    actor: string,
  ): Promise<ResidentAgendaEvent>;

  update(
    eventId: EntityId,
    input: ResidentAgendaEventUpdateInput,
    actor: string,
    organizationId?: EntityId,
  ): Promise<ResidentAgendaEvent>;

  /**
   * Soft-delete. No se borran registros físicamente: cumplen auditoría de
   * "quién agendó qué y hasta cuándo" aunque la actividad haya sido cancelada.
   */
  softDelete(
    eventId: EntityId,
    actor: string,
    organizationId?: EntityId,
  ): Promise<void>;
}

export const RESIDENT_AGENDA_REPOSITORY = Symbol('RESIDENT_AGENDA_REPOSITORY');
