import axios from 'axios';

import { createAppwriteJwt } from './appwrite';

const configuredBaseUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: configuredBaseUrl.replace(/\/$/, ''),
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

// Authenticated endpoints opt in explicitly. Public health and verification
// requests never create or send an Appwrite JWT unnecessarily.
api.interceptors.request.use(async (config) => {
  if (config.requireAppwriteAuth) {
    const token = await createAppwriteJwt();
    if (typeof config.headers?.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  return config;
});

export function withAppwriteAuth(config = {}) {
  return { ...config, requireAppwriteAuth: true };
}

export async function getLiveness(signal) {
  const response = await api.get('/health/', { signal });
  return response.data;
}

export default api;
