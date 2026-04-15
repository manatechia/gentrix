import type {
  ApiEnvelope,
  ForcedPasswordChangeInput,
  PasswordResetResponse,
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

export async function resetUserPassword(
  userId: string,
): Promise<ApiEnvelope<PasswordResetResponse>> {
  const response = await apiClient.post<ApiEnvelope<PasswordResetResponse>>(
    `/api/users/${encodeURIComponent(userId)}/reset-password`,
  );

  return response.data;
}

export async function changeOwnPassword(
  input: ForcedPasswordChangeInput,
): Promise<ApiEnvelope<{ success: true }>> {
  const response = await apiClient.post<ApiEnvelope<{ success: true }>>(
    '/api/users/me/change-password',
    input,
  );

  return response.data;
}
