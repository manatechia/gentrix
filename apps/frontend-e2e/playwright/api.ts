import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

import type {
  ApiEnvelope,
  AuthLoginRequest,
  AuthLoginResponse,
  MedicationCatalogItem,
  MedicationOverview,
  ResidentOverview,
  TeamMemberOverview,
  UserSchedule,
  UserOverview,
} from '@gentrix/shared-types';

import { demoCredentials } from '../../frontend/src/features/auth/constants/demo-credentials';
import { getApiBaseUrl } from './paths';

function buildRequestFailureMessage(response: APIResponse): string {
  return `${response.url()} returned ${response.status()} ${response.statusText()}`;
}

async function readEnvelope<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), buildRequestFailureMessage(response)).toBeTruthy();

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export function buildAuthHeaders(token: string): Record<string, string> {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function loginWithDemoCredentials(
  request: APIRequestContext,
): Promise<AuthLoginResponse> {
  return loginWithCredentials(request, demoCredentials);
}

export async function loginWithCredentials(
  request: APIRequestContext,
  credentials: AuthLoginRequest,
): Promise<AuthLoginResponse> {
  const response = await request.post(`${getApiBaseUrl()}/api/auth/login`, {
    data: credentials,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  return readEnvelope<AuthLoginResponse>(response);
}

export async function fetchResidents(
  request: APIRequestContext,
  token: string,
): Promise<ResidentOverview[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/residents`, {
    headers: buildAuthHeaders(token),
  });

  return readEnvelope<ResidentOverview[]>(response);
}

export async function fetchMedicationCatalog(
  request: APIRequestContext,
  token: string,
): Promise<MedicationCatalogItem[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/medications/catalog`, {
    headers: buildAuthHeaders(token),
  });

  return readEnvelope<MedicationCatalogItem[]>(response);
}

export async function fetchMedicationOrders(
  request: APIRequestContext,
  token: string,
): Promise<MedicationOverview[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/medications`, {
    headers: buildAuthHeaders(token),
  });

  return readEnvelope<MedicationOverview[]>(response);
}

export async function fetchTeam(
  request: APIRequestContext,
  token: string,
): Promise<TeamMemberOverview[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/users/team`, {
    headers: buildAuthHeaders(token),
  });

  return readEnvelope<TeamMemberOverview[]>(response);
}

export async function fetchUserSchedules(
  request: APIRequestContext,
  token: string,
  userId: string,
): Promise<UserSchedule[]> {
  const response = await request.get(
    `${getApiBaseUrl()}/api/users/${userId}/schedules`,
    {
      headers: buildAuthHeaders(token),
    },
  );

  return readEnvelope<UserSchedule[]>(response);
}

export async function fetchUsers(
  request: APIRequestContext,
  token: string,
): Promise<UserOverview[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/users`, {
    headers: buildAuthHeaders(token),
  });

  return readEnvelope<UserOverview[]>(response);
}
