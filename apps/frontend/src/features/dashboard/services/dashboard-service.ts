import type { ApiEnvelope, DashboardSnapshot } from '@gentrix/shared-types';

import { apiClient } from '../../../shared/config/api-client';

export async function getDashboardSnapshot(
): Promise<ApiEnvelope<DashboardSnapshot>> {
  const response = await apiClient.get<ApiEnvelope<DashboardSnapshot>>('/api/dashboard');

  return response.data;
}
