import type {
  ApiEnvelope,
  ResidentCreateInput,
  ResidentDetail,
  ResidentOverview,
  ResidentUpdateInput,
} from '@gentrix/shared-types';

import { apiClient } from '../../../shared/config/api-client';

export async function getResidents(): Promise<ApiEnvelope<ResidentOverview[]>> {
  const response = await apiClient.get<ApiEnvelope<ResidentOverview[]>>(
    '/api/residents',
  );

  return response.data;
}

export async function getResidentById(
  residentId: string,
): Promise<ApiEnvelope<ResidentDetail>> {
  const response = await apiClient.get<ApiEnvelope<ResidentDetail>>(
    `/api/residents/${residentId}`,
  );

  return response.data;
}

export async function createResident(
  input: ResidentCreateInput,
): Promise<ApiEnvelope<ResidentOverview>> {
  const response = await apiClient.post<ApiEnvelope<ResidentOverview>>(
    '/api/residents',
    input,
  );

  return response.data;
}

export async function updateResident(
  residentId: string,
  input: ResidentUpdateInput,
): Promise<ApiEnvelope<ResidentDetail>> {
  const response = await apiClient.put<ApiEnvelope<ResidentDetail>>(
    `/api/residents/${residentId}`,
    input,
  );

  return response.data;
}
