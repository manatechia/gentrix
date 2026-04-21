import axios, { type AxiosError } from 'axios';
import { nanoid } from 'nanoid';

import { readStoredAuthToken } from '../lib/auth-token-storage';
import { reportClientError } from '../lib/client-error-reporter';

// En dev usamos rutas relativas y dejamos que el proxy de Vite reenvie
// '/api', '/health' y '/snapshot' al backend local. En produccion (Vercel)
// VITE_API_BASE_URL apunta al servicio de Render para que el browser
// llame directo al backend.
const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || '/';

const REQUEST_ID_HEADER = 'x-request-id';

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = readStoredAuthToken();

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  if (!config.headers.get(REQUEST_ID_HEADER)) {
    config.headers.set(REQUEST_ID_HEADER, nanoid(12));
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    // 401/403 son parte del flujo normal (sesiones expiradas, guards).
    // 4xx "client error" tampoco son ruido accionable para el logger.
    const shouldReport = !status || status >= 500;

    if (shouldReport) {
      const requestId = error.config?.headers?.get?.(REQUEST_ID_HEADER) as
        | string
        | undefined;
      reportClientError({
        severity: 'error',
        message: `HTTP ${status ?? 'network'} ${error.config?.method?.toUpperCase() ?? ''} ${error.config?.url ?? ''}: ${error.message}`,
        requestId,
        context: {
          status,
          code: error.code,
        },
      });
    }

    return Promise.reject(error);
  },
);
