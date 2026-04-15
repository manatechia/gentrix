/**
 * Helpers para la variante operacional del dashboard: saludo, turno, y
 * categorización de ocurrencias de agenda por cercanía al "ahora".
 *
 * Los tramos horarios son fijos por ahora (06–14 mañana, 14–22 tarde,
 * 22–06 noche). Cuando integremos staff schedules con horario real del
 * usuario, esto se reemplaza por un cálculo basado en la asignación.
 */

export type ShiftId = 'morning' | 'afternoon' | 'night';

export interface ShiftInfo {
  id: ShiftId;
  label: string;
  startHour: number;
  endHour: number;
  rangeLabel: string;
}

const SHIFTS: Record<ShiftId, ShiftInfo> = {
  morning: {
    id: 'morning',
    label: 'Turno mañana',
    startHour: 6,
    endHour: 14,
    rangeLabel: '06:00 a 14:00',
  },
  afternoon: {
    id: 'afternoon',
    label: 'Turno tarde',
    startHour: 14,
    endHour: 22,
    rangeLabel: '14:00 a 22:00',
  },
  night: {
    id: 'night',
    label: 'Turno noche',
    startHour: 22,
    endHour: 6,
    rangeLabel: '22:00 a 06:00',
  },
};

export function getShiftForDate(date: Date): ShiftInfo {
  const hour = date.getHours();
  if (hour >= 6 && hour < 14) return SHIFTS.morning;
  if (hour >= 14 && hour < 22) return SHIFTS.afternoon;
  return SHIFTS.night;
}

export function getGreetingForDate(date: Date): string {
  const hour = date.getHours();
  if (hour >= 6 && hour < 13) return 'Buenos días';
  if (hour >= 13 && hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * Extrae el primer nombre de pila para el saludo.
 * "María López" → "María"; "Ana" → "Ana".
 */
export function getFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/, 1)[0];
}

export type TaskPriorityBucket = 'now' | 'soon' | 'later' | 'past';

const MS_MINUTE = 60 * 1000;
const MS_HOUR = 60 * MS_MINUTE;

/**
 * Clasifica una ocurrencia contra un reloj de referencia.
 *
 * - `now`: ventana [-15min, +30min] respecto al reloj → lo que hay que
 *   hacer ya o que acaba de pasar.
 * - `soon`: (+30min, +2h] → lo que viene.
 * - `later`: > +2h del día en curso.
 * - `past`: antes de -15min (no se muestra en los bloques principales).
 */
export function classifyOccurrenceByTime(
  scheduledAtIso: string,
  now: Date,
): TaskPriorityBucket {
  const scheduled = new Date(scheduledAtIso).getTime();
  const reference = now.getTime();
  const diff = scheduled - reference;

  if (diff < -15 * MS_MINUTE) return 'past';
  if (diff <= 30 * MS_MINUTE) return 'now';
  if (diff <= 2 * MS_HOUR) return 'soon';
  return 'later';
}

/**
 * Heurística de categoría a partir del título, mientras no exista una
 * `category` explícita en el modelo de agenda. Útil solo para código de
 * color visual — no para lógica de negocio.
 */
export type TaskKind = 'medication' | 'activity' | 'medical' | 'other';

export function inferTaskKind(title: string): TaskKind {
  const normalized = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (/medic|farmac|dosis|pastilla|inyecc/.test(normalized)) {
    return 'medication';
  }
  if (/medico|traslado|consulta|turno medic|hospital|clinic/.test(normalized)) {
    return 'medical';
  }
  if (
    /paseo|yoga|cumple|actividad|baile|musica|juego|taller|gimnasia|recreac/.test(
      normalized,
    )
  ) {
    return 'activity';
  }
  return 'other';
}
