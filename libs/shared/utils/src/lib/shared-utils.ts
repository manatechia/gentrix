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
