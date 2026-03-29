import * as path from 'node:path';

const workspaceRoot = process.cwd();

export function getFrontendBaseUrl(): string {
  return process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4200';
}

export function getApiBaseUrl(): string {
  return process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3333';
}

export function getAuthStorageStatePath(): string {
  return path.resolve(workspaceRoot, 'dist/apps/frontend-e2e/.auth/user.json');
}

export function createProjectSlug(projectName: string): string {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function createNumericScenarioId(projectName: string): string {
  const projectHash = [...projectName].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return String((Date.now() + projectHash) % 1_000_000).padStart(6, '0');
}

export function createFutureDate(daysAhead: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}
