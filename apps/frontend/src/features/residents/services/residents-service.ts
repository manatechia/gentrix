import type {
  ApiEnvelope,
  ResidentCreateInput,
  ResidentDetail,
  ResidentOverview,
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
