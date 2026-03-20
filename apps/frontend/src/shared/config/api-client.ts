import axios from 'axios';

import { readStoredAuthToken } from '../lib/auth-token-storage';

export const apiClient = axios.create({
  baseURL: '/',
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
