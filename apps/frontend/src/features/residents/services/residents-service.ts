import type {
  ApiEnvelope,
  ResidentAgendaEvent,
  ResidentAgendaEventCreateInput,
  ResidentAgendaEventUpdateInput,
  ResidentAgendaOccurrence,
  ResidentAgendaOccurrenceOverrideInput,
  ResidentAgendaOccurrenceWithResident,
  ResidentAgendaSeries,
  ResidentAgendaSeriesCreateInput,
  ResidentAgendaSeriesUpdateInput,
  ResidentCareStatus,
  ResidentCareStatusChangeResponse,
  ResidentCareStatusUpdateInput,
  ResidentCreateInput,
  ResidentDetail,
  ResidentLiveProfile,
  ResidentObservationNote,
  ResidentObservationNoteCreateInput,
  ResidentObservationNoteCreateResponse,
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

/**
 * Ocurrencias del día actual del residente (mezcla eventos one-off +
 * series expandidas con excepciones aplicadas).
 */
export async function getResidentAgendaOccurrences(
  residentId: string,
): Promise<ApiEnvelope<ResidentAgendaOccurrence[]>> {
  const response = await apiClient.get<ApiEnvelope<ResidentAgendaOccurrence[]>>(
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

/**
 * Ocurrencias del día de toda la organización para el bloque
 * "Próximas tareas" del dashboard.
 */
export async function getUpcomingAgendaOccurrences(): Promise<
  ApiEnvelope<ResidentAgendaOccurrenceWithResident[]>
> {
  const response = await apiClient.get<
    ApiEnvelope<ResidentAgendaOccurrenceWithResident[]>
  >(`/api/agenda/upcoming`);

  return response.data;
}

export async function createResidentAgendaSeries(
  residentId: string,
  input: ResidentAgendaSeriesCreateInput,
): Promise<ApiEnvelope<ResidentAgendaSeries>> {
  const response = await apiClient.post<ApiEnvelope<ResidentAgendaSeries>>(
    `/api/residents/${residentId}/agenda/series`,
    input,
  );
  return response.data;
}

export async function updateResidentAgendaSeries(
  residentId: string,
  seriesId: string,
  input: ResidentAgendaSeriesUpdateInput,
): Promise<ApiEnvelope<ResidentAgendaSeries>> {
  const response = await apiClient.patch<ApiEnvelope<ResidentAgendaSeries>>(
    `/api/residents/${residentId}/agenda/series/${seriesId}`,
    input,
  );
  return response.data;
}

export async function deleteResidentAgendaSeries(
  residentId: string,
  seriesId: string,
): Promise<void> {
  await apiClient.delete(
    `/api/residents/${residentId}/agenda/series/${seriesId}`,
  );
}

export async function skipResidentAgendaOccurrence(
  residentId: string,
  seriesId: string,
  occurrenceDate: string,
): Promise<void> {
  await apiClient.post(
    `/api/residents/${residentId}/agenda/series/${seriesId}/occurrences/${occurrenceDate}/skip`,
  );
}

export async function overrideResidentAgendaOccurrence(
  residentId: string,
  seriesId: string,
  occurrenceDate: string,
  input: ResidentAgendaOccurrenceOverrideInput,
): Promise<void> {
  await apiClient.patch(
    `/api/residents/${residentId}/agenda/series/${seriesId}/occurrences/${occurrenceDate}`,
    input,
  );
}

export async function clearResidentAgendaOccurrenceException(
  residentId: string,
  seriesId: string,
  occurrenceDate: string,
): Promise<void> {
  await apiClient.delete(
    `/api/residents/${residentId}/agenda/series/${seriesId}/occurrences/${occurrenceDate}`,
  );
}

export async function getResidentObservationNotes(
  residentId: string,
): Promise<ApiEnvelope<ResidentObservationNote[]>> {
  const response = await apiClient.get<ApiEnvelope<ResidentObservationNote[]>>(
    `/api/residents/${residentId}/observations`,
  );

  return response.data;
}

export async function createResidentObservationNote(
  residentId: string,
  input: ResidentObservationNoteCreateInput,
): Promise<ApiEnvelope<ResidentObservationNoteCreateResponse>> {
  const response = await apiClient.post<
    ApiEnvelope<ResidentObservationNoteCreateResponse>
  >(`/api/residents/${residentId}/observations`, input);

  return response.data;
}

export async function deleteResidentObservationNote(
  residentId: string,
  noteId: string,
): Promise<void> {
  await apiClient.delete(
    `/api/residents/${residentId}/observations/${noteId}`,
  );
}
