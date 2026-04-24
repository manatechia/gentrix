import type {
  ApiEnvelope,
  HourSettlement,
  HourSettlementDetail,
  HourSettlementIssueInput,
  HourSettlementPeriodInput,
  HourSettlementPreview,
  MembershipHourlyRate,
  MembershipHourlyRateCreateInput,
  MembershipHourlyRateUpdateInput,
  WorkedHourEntry,
  WorkedHourEntryCreateInput,
  WorkedHourEntryUpdateInput,
} from '@gentrix/shared-types';

import { apiClient } from '../../../shared/config/api-client';

export async function listHourlyRates(
  userId: string,
): Promise<ApiEnvelope<MembershipHourlyRate[]>> {
  const response = await apiClient.get<ApiEnvelope<MembershipHourlyRate[]>>(
    `/api/users/${encodeURIComponent(userId)}/hourly-rates`,
  );
  return response.data;
}

export async function createHourlyRate(
  userId: string,
  input: MembershipHourlyRateCreateInput,
): Promise<ApiEnvelope<MembershipHourlyRate>> {
  const response = await apiClient.post<ApiEnvelope<MembershipHourlyRate>>(
    `/api/users/${encodeURIComponent(userId)}/hourly-rates`,
    input,
  );
  return response.data;
}

export async function updateHourlyRate(
  rateId: string,
  input: MembershipHourlyRateUpdateInput,
): Promise<ApiEnvelope<MembershipHourlyRate>> {
  const response = await apiClient.patch<ApiEnvelope<MembershipHourlyRate>>(
    `/api/users/hourly-rates/${encodeURIComponent(rateId)}`,
    input,
  );
  return response.data;
}

export async function listHourEntries(
  userId: string,
  options: { from?: string; to?: string; settled?: boolean } = {},
): Promise<ApiEnvelope<WorkedHourEntry[]>> {
  const params = new URLSearchParams();
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  if (options.settled !== undefined)
    params.set('settled', options.settled ? 'true' : 'false');
  const query = params.toString();
  const url = `/api/users/${encodeURIComponent(userId)}/hour-entries${
    query ? `?${query}` : ''
  }`;
  const response = await apiClient.get<ApiEnvelope<WorkedHourEntry[]>>(url);
  return response.data;
}

export async function createHourEntry(
  userId: string,
  input: WorkedHourEntryCreateInput,
): Promise<ApiEnvelope<WorkedHourEntry>> {
  const response = await apiClient.post<ApiEnvelope<WorkedHourEntry>>(
    `/api/users/${encodeURIComponent(userId)}/hour-entries`,
    input,
  );
  return response.data;
}

export async function updateHourEntry(
  entryId: string,
  input: WorkedHourEntryUpdateInput,
): Promise<ApiEnvelope<WorkedHourEntry>> {
  const response = await apiClient.patch<ApiEnvelope<WorkedHourEntry>>(
    `/api/users/hour-entries/${encodeURIComponent(entryId)}`,
    input,
  );
  return response.data;
}

export async function deleteHourEntry(
  entryId: string,
): Promise<ApiEnvelope<{ success: true }>> {
  const response = await apiClient.delete<ApiEnvelope<{ success: true }>>(
    `/api/users/hour-entries/${encodeURIComponent(entryId)}`,
  );
  return response.data;
}

export async function previewSettlement(
  userId: string,
  input: HourSettlementPeriodInput,
): Promise<ApiEnvelope<HourSettlementPreview>> {
  const response = await apiClient.post<ApiEnvelope<HourSettlementPreview>>(
    `/api/users/${encodeURIComponent(userId)}/settlements/preview`,
    input,
  );
  return response.data;
}

export async function issueSettlement(
  userId: string,
  input: HourSettlementIssueInput,
): Promise<ApiEnvelope<HourSettlementDetail>> {
  const response = await apiClient.post<ApiEnvelope<HourSettlementDetail>>(
    `/api/users/${encodeURIComponent(userId)}/settlements`,
    input,
  );
  return response.data;
}

export async function listSettlements(
  userId: string,
): Promise<ApiEnvelope<HourSettlement[]>> {
  const response = await apiClient.get<ApiEnvelope<HourSettlement[]>>(
    `/api/users/${encodeURIComponent(userId)}/settlements`,
  );
  return response.data;
}

export async function getSettlementDetail(
  settlementId: string,
): Promise<ApiEnvelope<HourSettlementDetail>> {
  const response = await apiClient.get<ApiEnvelope<HourSettlementDetail>>(
    `/api/settlements/${encodeURIComponent(settlementId)}`,
  );
  return response.data;
}

export async function markSettlementPaid(
  settlementId: string,
): Promise<ApiEnvelope<HourSettlementDetail>> {
  const response = await apiClient.post<ApiEnvelope<HourSettlementDetail>>(
    `/api/settlements/${encodeURIComponent(settlementId)}/mark-paid`,
  );
  return response.data;
}

export async function cancelSettlement(
  settlementId: string,
): Promise<ApiEnvelope<HourSettlementDetail>> {
  const response = await apiClient.post<ApiEnvelope<HourSettlementDetail>>(
    `/api/settlements/${encodeURIComponent(settlementId)}/cancel`,
  );
  return response.data;
}
