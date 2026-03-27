function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, '-');
}

export function toTestIdSegment(value: string): string {
  const normalizedValue = normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalizedValue || 'empty';
}

export function buildOptionTestId(
  baseTestId: string,
  value: string,
): string {
  return `${baseTestId}-option-${toTestIdSegment(value)}`;
}
