import { BadRequestException } from '@nestjs/common';

import {
  RESIDENT_CARE_STATUSES,
  RESIDENT_CARE_STATUS_TRANSITIONS,
  type ResidentCareStatus,
} from '@gentrix/shared-types';

/**
 * Indica si `value` es uno de los estados clínicos soportados.
 *
 * Útil al normalizar valores leídos desde Postgres (la columna `careStatus`
 * es TEXT para mantener la extensibilidad sin forzar una nueva migración por
 * cada estado nuevo).
 */
export function isResidentCareStatus(
  value: string,
): value is ResidentCareStatus {
  return (RESIDENT_CARE_STATUSES as readonly string[]).includes(value);
}

/**
 * Devuelve true si la transición `from -> to` está permitida por la tabla de
 * transiciones declarada en `shared-types`. Las transiciones inútiles
 * (mismo estado) NO se consideran válidas en esta función — se modelan como
 * no-op a nivel servicio para no ensuciar la auditoría.
 */
export function canTransition(
  from: ResidentCareStatus,
  to: ResidentCareStatus,
): boolean {
  if (from === to) {
    return false;
  }

  return RESIDENT_CARE_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Lanza BadRequestException si la transición no está permitida.
 * Pensado para usarse en la capa servicio antes de tocar el repositorio.
 */
export function assertTransition(
  from: ResidentCareStatus,
  to: ResidentCareStatus,
): void {
  if (from === to) {
    throw new BadRequestException(
      `El residente ya se encuentra en el estado "${to}".`,
    );
  }

  if (!canTransition(from, to)) {
    throw new BadRequestException(
      `No se puede mover el residente del estado "${from}" al estado "${to}".`,
    );
  }
}
