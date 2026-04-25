import { BadRequestException } from '@nestjs/common';

import {
  RESIDENT_CARE_STATUSES,
  RESIDENT_CARE_STATUS_CLOSURE_REASONS,
  RESIDENT_CARE_STATUS_TRANSITIONS,
  type ResidentCareStatus,
  type ResidentCareStatusClosureReason,
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

/**
 * Indica si la transición representa el cierre formal de una observación
 * (`en_observacion -> normal`). El cierre exige `closureReason` por política
 * y queda registrado como evento auditable en `ResidentCareStatusChange`.
 */
export function isObservationClosure(
  from: ResidentCareStatus,
  to: ResidentCareStatus,
): boolean {
  return from === 'en_observacion' && to === 'normal';
}

/**
 * Devuelve true si `value` es un motivo de cierre soportado.
 */
export function isResidentCareStatusClosureReason(
  value: string,
): value is ResidentCareStatusClosureReason {
  return (RESIDENT_CARE_STATUS_CLOSURE_REASONS as readonly string[]).includes(
    value,
  );
}

/**
 * Valida el motivo de cierre cuando la transición lo amerita. Si la
 * transición no es un cierre, el motivo se descarta (el repositorio no lo
 * persiste). Si lo es, debe estar presente y ser uno del catálogo.
 */
export function assertClosureReason(
  from: ResidentCareStatus,
  to: ResidentCareStatus,
  closureReason: string | undefined,
): void {
  if (!isObservationClosure(from, to)) {
    return;
  }

  if (!closureReason) {
    throw new BadRequestException(
      'El cierre de observación requiere un motivo.',
    );
  }

  if (!isResidentCareStatusClosureReason(closureReason)) {
    throw new BadRequestException(
      'El motivo de cierre informado no es válido.',
    );
  }
}
