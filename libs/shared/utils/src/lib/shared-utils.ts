import type { EntityId, IsoDateString } from '@gentrix/shared-types';

function cyrb128(value: string): [number, number, number, number] {
  let h1 = 1_779_033_703;
  let h2 = 3_144_134_277;
  let h3 = 1_013_904_242;
  let h4 = 2_773_480_762;

  for (let index = 0; index < value.length; index += 1) {
    const charCode = value.charCodeAt(index);

    h1 = h2 ^ Math.imul(h1 ^ charCode, 597_399_067);
    h2 = h3 ^ Math.imul(h2 ^ charCode, 2_869_860_233);
    h3 = h4 ^ Math.imul(h3 ^ charCode, 951_274_213);
    h4 = h1 ^ Math.imul(h4 ^ charCode, 2_716_044_179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597_399_067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2_869_860_233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951_274_213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2_716_044_179);

  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

function toFixedHex(value: number): string {
  return value.toString(16).padStart(8, '0');
}

function buildStableHexHash(value: string): string {
  return cyrb128(value).map(toFixedHex).join('');
}

function formatHashAsUuid(hash: string): string {
  const characters = hash.slice(0, 32).split('');

  characters[12] = '5';
  characters[16] = ((Number.parseInt(characters[16], 16) & 0x3) | 0x8).toString(16);

  return [
    characters.slice(0, 8).join(''),
    characters.slice(8, 12).join(''),
    characters.slice(12, 16).join(''),
    characters.slice(16, 20).join(''),
    characters.slice(20, 32).join(''),
  ].join('-');
}

export function createEntityId(prefix: string, seed: string): EntityId {
  const hash = buildStableHexHash(`${prefix.trim()}:${seed.trim()}`);

  return formatHashAsUuid(hash) as EntityId;
}

export function createRandomEntityId(): EntityId {
  if (
    typeof globalThis.crypto?.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID() as EntityId;
  }

  const fallbackSeed = `${Date.now()}-${Math.random()}-${Math.random()}`;
  return formatHashAsUuid(buildStableHexHash(fallbackSeed)) as EntityId;
}

export function toIsoDateString(value: Date | string): IsoDateString {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

/**
 * Devuelve el Date UTC que corresponde a la medianoche local del día que
 * contiene `reference` en la zona horaria `timeZone` (ej. 'America/Argentina/Buenos_Aires').
 *
 * Ejemplo: reference = 2026-04-15T13:30:00Z, timeZone = 'America/Argentina/Buenos_Aires'
 * → devuelve 2026-04-15T03:00:00Z (00:00 local = 03:00 UTC en ART).
 *
 * Implementación zero-deps basada en `Intl.DateTimeFormat` — proyectamos la
 * fecha a la TZ pedida, reconstruimos el timestamp buscado y el offset local
 * con una sola conversión recíproca.
 */
export function startOfLocalDay(reference: Date, timeZone: string): Date {
  const { year, month, day } = extractLocalYmd(reference, timeZone);
  return localYmdHmToUtc(year, month, day, 0, 0, timeZone);
}

/**
 * Devuelve el Date UTC que corresponde al inicio del día siguiente (exclusivo
 * para rangos). Útil para `scheduledAt < endOfLocalDay(today)`.
 */
export function endOfLocalDay(reference: Date, timeZone: string): Date {
  const start = startOfLocalDay(reference, timeZone);
  // Sumamos 24h + un margen para cubrir DST "spring forward" (23h) / "fall
  // back" (25h). Luego normalizamos al inicio del día siguiente.
  const candidate = new Date(start.getTime() + 26 * 60 * 60 * 1000);
  return startOfLocalDay(candidate, timeZone);
}

/**
 * Formatea `reference` como `YYYY-MM-DD` en la TZ pedida.
 */
export function formatLocalYmd(reference: Date, timeZone: string): string {
  const { year, month, day } = extractLocalYmd(reference, timeZone);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Combina una fecha local `YYYY-MM-DD` y una hora `HH:mm` en la TZ pedida, y
 * devuelve el Date UTC correspondiente.
 */
export function localDateTimeToUtc(
  ymd: string,
  hhmm: string,
  timeZone: string,
): Date {
  const [yearToken, monthToken, dayToken] = ymd.split('-');
  const [hoursToken, minutesToken] = hhmm.split(':');
  return localYmdHmToUtc(
    Number.parseInt(yearToken, 10),
    Number.parseInt(monthToken, 10),
    Number.parseInt(dayToken, 10),
    Number.parseInt(hoursToken, 10),
    Number.parseInt(minutesToken, 10),
    timeZone,
  );
}

function extractLocalYmd(
  reference: Date,
  timeZone: string,
): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(reference);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  return {
    year: Number.parseInt(map['year'] ?? '0', 10),
    month: Number.parseInt(map['month'] ?? '0', 10),
    day: Number.parseInt(map['day'] ?? '0', 10),
  };
}

/**
 * Convierte `YYYY-MM-DD HH:mm` en TZ local → Date UTC usando el offset actual
 * de la zona para ese instante. Precisión: 1 minuto.
 */
function localYmdHmToUtc(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timeZone: string,
): Date {
  // Primera aproximación: interpretar como UTC. El error es exactamente
  // `offsetMinutes(timeZone, candidate)`.
  const guess = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const offset = timezoneOffsetMinutes(new Date(guess), timeZone);
  return new Date(guess - offset * 60_000);
}

/**
 * Offset (en minutos) de la TZ pedida respecto de UTC para un instante dado.
 * Positivo para zonas al este de UTC (ej. Europe/Paris → 60 o 120),
 * negativo para zonas al oeste (ej. Argentina → -180).
 */
function timezoneOffsetMinutes(reference: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(reference);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  // `hour: 2-digit` con `hour12:false` puede devolver "24" a medianoche en
  // algunas implementaciones — normalizamos a 0.
  const hour = Number.parseInt(map['hour'] ?? '0', 10) % 24;
  const asUtc = Date.UTC(
    Number.parseInt(map['year'] ?? '0', 10),
    Number.parseInt(map['month'] ?? '0', 10) - 1,
    Number.parseInt(map['day'] ?? '0', 10),
    hour,
    Number.parseInt(map['minute'] ?? '0', 10),
    Number.parseInt(map['second'] ?? '0', 10),
  );
  return Math.round((asUtc - reference.getTime()) / 60_000);
}

export function calculateAge(
  birthDate: IsoDateString,
  referenceDate: Date = new Date(),
): number {
  const birth = new Date(birthDate);
  let age = referenceDate.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = referenceDate.getUTCMonth() - birth.getUTCMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && referenceDate.getUTCDate() < birth.getUTCDate())
  ) {
    age -= 1;
  }

  return Math.max(age, 0);
}
