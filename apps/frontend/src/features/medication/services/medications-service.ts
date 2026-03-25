import type {
  ApiEnvelope,
  MedicationCatalogItem,
  MedicationCreateInput,
  MedicationDetail,
  MedicationOverview,
  MedicationUpdateInput,
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
