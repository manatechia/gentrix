import type {
  EntityId,
  ResidentObservationNote,
} from '@gentrix/shared-types';

/**
 * Repositorio de observaciones operativas simples del residente. Todas las
 * consultas filtran por soft-delete y, cuando se provee, por organización
 * (multi-tenant).
 */
export interface ResidentObservationNotesRepository {
  /**
   * Lista todas las observaciones no borradas de un residente, ordenadas
   * por `createdAt` descendente (más recientes primero).
   */
  listByResidentId(
    residentId: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentObservationNote[]>;

  findById(
    id: EntityId,
    organizationId: EntityId,
  ): Promise<ResidentObservationNote | null>;

  create(
    residentId: EntityId,
    input: { note: string },
    actor: string,
  ): Promise<ResidentObservationNote>;

  /**
   * Soft-delete. Preserva auditoría de "quién registró qué y hasta cuándo".
   */
  softDelete(
    id: EntityId,
    actor: string,
    organizationId: EntityId,
  ): Promise<void>;
}

export const RESIDENT_OBSERVATION_NOTES_REPOSITORY = Symbol(
  'RESIDENT_OBSERVATION_NOTES_REPOSITORY',
);
