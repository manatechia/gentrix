import type {
  ApiEnvelope,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthSession,
  LogoutResponse,
} from '@gentrix/shared-types';

import { apiClient } from '../../../shared/config/api-client';

export async function login(
  credentials: AuthLoginRequest,
): Promise<ApiEnvelope<AuthLoginResponse>> {
  const response = await apiClient.post<ApiEnvelope<AuthLoginResponse>>(
    '/api/auth/login',
    credentials,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data;
}

export async function getSession(): Promise<ApiEnvelope<AuthSession>> {
  const response = await apiClient.get<ApiEnvelope<AuthSession>>(
    '/api/auth/session',
  );

  return response.data;
}

export async function logout(): Promise<ApiEnvelope<LogoutResponse>> {
  const response = await apiClient.post<ApiEnvelope<LogoutResponse>>(
    '/api/auth/logout',
    {},
  );

  return response.data;
}
