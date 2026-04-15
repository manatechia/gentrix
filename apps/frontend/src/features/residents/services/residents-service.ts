import type {
  ApiEnvelope,
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaEventWithResident,
  ResidentCareStatus,
  ResidentCareStatusChangeResponse,
  ResidentCareStatusUpdateInput,
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

export async function getResidentsUnderObservation(): Promise<
  ApiEnvelope<ResidentOverview[]>
> {
  const response = await apiClient.get<ApiEnvelope<ResidentOverview[]>>(
    '/api/residents/under-observation',
  );

  return response.data;
}

export async function updateResidentCareStatus(
  residentId: string,
  toStatus: ResidentCareStatus,
): Promise<ApiEnvelope<ResidentCareStatusChangeResponse>> {
  const payload: ResidentCareStatusUpdateInput = { toStatus };
  const response = await apiClient.patch<
    ApiEnvelope<ResidentCareStatusChangeResponse>
  >(`/api/residents/${residentId}/care-status`, payload);

  return response.data;
}

export async function getResidentAgendaEvents(
  residentId: string,
): Promise<ApiEnvelope<ResidentAgendaEvent[]>> {
  const response = await apiClient.get<ApiEnvelope<ResidentAgendaEvent[]>>(
    `/api/residents/${residentId}/agenda`,
  );

  return response.data;
}

export async function createResidentAgendaEvent(
  residentId: string,
  input: ResidentAgendaEventCreateInput,
): Promise<ApiEnvelope<ResidentAgendaEvent>> {
  const response = await apiClient.post<ApiEnvelope<ResidentAgendaEvent>>(
    `/api/residents/${residentId}/agenda`,
    input,
  );

  return response.data;
}

export async function updateResidentAgendaEvent(
  residentId: string,
  eventId: string,
  input: ResidentAgendaEventUpdateInput,
): Promise<ApiEnvelope<ResidentAgendaEvent>> {
  const response = await apiClient.patch<ApiEnvelope<ResidentAgendaEvent>>(
    `/api/residents/${residentId}/agenda/${eventId}`,
    input,
  );

  return response.data;
}

export async function deleteResidentAgendaEvent(
  residentId: string,
  eventId: string,
): Promise<void> {
  await apiClient.delete(`/api/residents/${residentId}/agenda/${eventId}`);
}

export async function getUpcomingAgendaEvents(
  limit = 20,
): Promise<ApiEnvelope<ResidentAgendaEventWithResident[]>> {
  const response = await apiClient.get<
    ApiEnvelope<ResidentAgendaEventWithResident[]>
  >(`/api/agenda/upcoming?limit=${limit}`);

  return response.data;
}
