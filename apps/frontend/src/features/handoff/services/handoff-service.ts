import type { ApiEnvelope, HandoffSnapshot } from '@gentrix/shared-types';

import { apiClient } from '../../../shared/config/api-client';

export async function getHandoffSnapshot(): Promise<
  ApiEnvelope<HandoffSnapshot>
> {
  const response =
    await apiClient.get<ApiEnvelope<HandoffSnapshot>>('/api/handoff');

  return response.data;
}
