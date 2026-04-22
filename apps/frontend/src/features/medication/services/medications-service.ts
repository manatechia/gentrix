import type {
  ApiEnvelope,
  MedicationCatalogItem,
  MedicationCreateInput,
  MedicationDetail,
  MedicationExecutionCreateInput,
  MedicationExecutionOverview,
  MedicationOverview,
  MedicationUpdateInput,
  ResidentShiftDoses,
} from '@gentrix/shared-types';

import { apiClient } from '../../../shared/config/api-client';

export async function getMedications(): Promise<ApiEnvelope<MedicationOverview[]>> {
  const response = await apiClient.get<ApiEnvelope<MedicationOverview[]>>(
    '/api/medications',
  );

  return response.data;
}

export async function getMedicationById(
  medicationId: string,
): Promise<ApiEnvelope<MedicationDetail>> {
  const response = await apiClient.get<ApiEnvelope<MedicationDetail>>(
    `/api/medications/${medicationId}`,
  );

  return response.data;
}

export async function getMedicationCatalog(): Promise<
  ApiEnvelope<MedicationCatalogItem[]>
> {
  const response = await apiClient.get<ApiEnvelope<MedicationCatalogItem[]>>(
    '/api/medications/catalog',
  );

  return response.data;
}

export async function createMedication(
  input: MedicationCreateInput,
): Promise<ApiEnvelope<MedicationOverview>> {
  const response = await apiClient.post<ApiEnvelope<MedicationOverview>>(
    '/api/medications',
    input,
  );

  return response.data;
}

export async function updateMedication(
  medicationId: string,
  input: MedicationUpdateInput,
): Promise<ApiEnvelope<MedicationDetail>> {
  const response = await apiClient.put<ApiEnvelope<MedicationDetail>>(
    `/api/medications/${medicationId}`,
    input,
  );

  return response.data;
}

export async function getMedicationExecutionsByMedicationId(
  medicationId: string,
): Promise<ApiEnvelope<MedicationExecutionOverview[]>> {
  const response = await apiClient.get<ApiEnvelope<MedicationExecutionOverview[]>>(
    `/api/medications/${medicationId}/executions`,
  );

  return response.data;
}

export async function getMedicationExecutionsByResidentId(
  residentId: string,
): Promise<ApiEnvelope<MedicationExecutionOverview[]>> {
  const response = await apiClient.get<ApiEnvelope<MedicationExecutionOverview[]>>(
    `/api/medications/resident/${residentId}/executions`,
  );

  return response.data;
}

export async function createMedicationExecution(
  medicationId: string,
  input: MedicationExecutionCreateInput,
): Promise<ApiEnvelope<MedicationExecutionOverview>> {
  const response = await apiClient.post<ApiEnvelope<MedicationExecutionOverview>>(
    `/api/medications/${medicationId}/executions`,
    input,
  );

  return response.data;
}

export async function getResidentShiftDoses(
  residentId: string,
): Promise<ApiEnvelope<ResidentShiftDoses>> {
  const response = await apiClient.get<ApiEnvelope<ResidentShiftDoses>>(
    `/api/medications/resident/${residentId}/shift-doses`,
  );

  return response.data;
}
