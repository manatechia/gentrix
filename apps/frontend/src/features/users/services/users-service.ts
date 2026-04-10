import type {
  ApiEnvelope,
  UserCreateInput,
  UserOverview,
} from '@gentrix/shared-types';

import { apiClient } from '../../../shared/config/api-client';

export async function getUsers(): Promise<ApiEnvelope<UserOverview[]>> {
  const response = await apiClient.get<ApiEnvelope<UserOverview[]>>('/api/users');

  return response.data;
}

export async function createUser(
  input: UserCreateInput,
): Promise<ApiEnvelope<UserOverview>> {
  const response = await apiClient.post<ApiEnvelope<UserOverview>>(
    '/api/users',
    input,
  );

  return response.data;
}
