const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const arDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function isoToAr(iso: string): string {
  if (!iso || !isoDatePattern.test(iso.slice(0, 10))) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function arToIso(ar: string): string | null {
  const match = arDatePattern.exec(ar.trim());
  if (!match) return null;
  const [, d, m, y] = match;
  const day = Number.parseInt(d, 10);
  const month = Number.parseInt(m, 10);
  const year = Number.parseInt(y, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${y}-${m}-${d}`;
}

export function todayAr(): string {
  return isoToAr(new Date().toISOString().slice(0, 10));
}
