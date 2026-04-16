import axios from 'axios';

import { readStoredAuthToken } from '../lib/auth-token-storage';

// En dev usamos rutas relativas y dejamos que el proxy de Vite reenvie
// '/api', '/health' y '/snapshot' al backend local. En produccion (Vercel)
// VITE_API_BASE_URL apunta al servicio de Render para que el browser
// llame directo al backend.
const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || '/';

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

  return config;
});
