import axios from 'axios';

import type { ApiEnvelope } from '@gentrix/shared-types';

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const payload = error.response?.data as
    | ApiEnvelope<{ message?: string }>
    | undefined;

  if (payload?.data && typeof payload.data.message === 'string') {
    return payload.data.message;
  }

  return fallback;
}

export function unwrapEnvelope<T>(payload: ApiEnvelope<T>): T {
  return payload.data;
}
