import type {
  ApiEnvelope,
  ClinicalHistoryEvent,
  ClinicalHistoryEventCreateInput,
  ResidentCreateInput,
  ResidentDetail,
  ResidentLiveProfile,
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

export async function getResidentLiveProfile(
  residentId: string,
): Promise<ApiEnvelope<ResidentLiveProfile>> {
  const response = await apiClient.get<ApiEnvelope<ResidentLiveProfile>>(
    `/api/residents/${residentId}/live-profile`,
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

export async function getClinicalHistoryEvents(
  residentId: string,
): Promise<ApiEnvelope<ClinicalHistoryEvent[]>> {
  const response = await apiClient.get<ApiEnvelope<ClinicalHistoryEvent[]>>(
    `/api/residents/${residentId}/clinical-history`,
  );

  return response.data;
}

export async function createClinicalHistoryEvent(
  residentId: string,
  input: ClinicalHistoryEventCreateInput,
): Promise<ApiEnvelope<ClinicalHistoryEvent>> {
  const response = await apiClient.post<ApiEnvelope<ClinicalHistoryEvent>>(
    `/api/residents/${residentId}/clinical-history`,
    input,
  );

  return response.data;
}
