/**
 * Helpers específicos de la agenda del residente.
 *
 * La UI captura fecha como DD/MM/YYYY y hora como HH:mm (inputs separados por
 * simplicidad). Estas funciones los combinan en un timestamp ISO 8601
 * interpretado en la zona horaria local del navegador — que es la que
 * representa el horario del personal.
 */

const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

/**
 * Combina fecha DD/MM/YYYY + hora HH:mm en un ISO string en zona local.
 * Devuelve null si el input es inválido.
 */
export function combineAgendaDateTime(
  dateInput: string,
  timeInput: string,
): string | null {
  const dateMatch = dateInput.match(DATE_PATTERN);
  const timeMatch = timeInput.match(TIME_PATTERN);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const [, dayToken, monthToken, yearToken] = dateMatch;
  const [, hoursToken, minutesToken] = timeMatch;
  const day = Number.parseInt(dayToken, 10);
  const month = Number.parseInt(monthToken, 10);
  const year = Number.parseInt(yearToken, 10);
  const hours = Number.parseInt(hoursToken, 10);
  const minutes = Number.parseInt(minutesToken, 10);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed.toISOString();
}

export function isAgendaDateTimeInFuture(
  dateInput: string,
  timeInput: string,
): boolean {
  const iso = combineAgendaDateTime(dateInput, timeInput);
  if (!iso) {
    return false;
  }
  return new Date(iso).getTime() > Date.now();
}

export function splitAgendaScheduledAt(scheduledAt: string): {
  date: string;
  time: string;
} {
  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '' };
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = String(parsed.getFullYear());
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}`,
  };
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  timeStyle: 'short',
});

export function formatAgendaDateTime(scheduledAt: string): string {
  return dateTimeFormatter.format(new Date(scheduledAt));
}

export function formatAgendaTime(scheduledAt: string): string {
  return timeFormatter.format(new Date(scheduledAt));
}

/**
 * Formateo progresivo mientras el usuario tipea (DD/MM/YYYY).
 */
export function formatAgendaDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Formateo progresivo mientras el usuario tipea (HH:mm).
 */
export function formatAgendaTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
