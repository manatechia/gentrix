import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

import type {
  ApiEnvelope,
  AuthLoginResponse,
  MedicationCatalogItem,
  MedicationOverview,
  ResidentOverview,
  StaffOverview,
  StaffSchedule,
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
  const response = await request.post(`${getApiBaseUrl()}/api/auth/login`, {
    data: demoCredentials,
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

export async function fetchStaff(
  request: APIRequestContext,
  token: string,
): Promise<StaffOverview[]> {
  const response = await request.get(`${getApiBaseUrl()}/api/staff`, {
    headers: buildAuthHeaders(token),
  });

  return readEnvelope<StaffOverview[]>(response);
}

export async function fetchStaffSchedules(
  request: APIRequestContext,
  token: string,
  staffId: string,
): Promise<StaffSchedule[]> {
  const response = await request.get(
    `${getApiBaseUrl()}/api/staff/${staffId}/schedules`,
    {
      headers: buildAuthHeaders(token),
    },
  );

  return readEnvelope<StaffSchedule[]>(response);
}
