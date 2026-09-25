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

/**
 * Submit a public fraud report. The caller supplies FormData so a future
 * server-side evidence pipeline can accept a file without exposing Appwrite
 * credentials or a public file URL in the browser.
 */
export async function submitFraudReport(
  formData,
  { signal, onUploadProgress, idempotencyKey } = {},
) {
  const response = await api.post('/reports/', formData, {
    signal,
    ...(onUploadProgress ? { onUploadProgress } : {}),
    headers: {
      'Idempotency-Key': idempotencyKey || createIdempotencyKey(),
    },
  });
  return response.data;
}

export async function askPublicAssistant(query, { signal, language = 'auto' } = {}) {
  const response = await api.post('/assistant/', { query, language }, { signal });
  return response.data;
}

export async function fetchVerifiedInformation({ query = '', category = '' } = {}, { signal } = {}) {
  const response = await api.get('/public/verified-information/', {
    params: { q: query || undefined, category: category || undefined },
    signal,
  });
  return response.data;
}

export async function fetchAdminOverview({ signal } = {}) {
  const response = await api.get('/admin/overview/', withAppwriteAuth({ signal }));
  return response.data;
}

export async function fetchKnowledgeSources({ q = '', status = '' } = {}, { signal } = {}) {
  const response = await api.get('/admin/knowledge-sources/', {
    ...withAppwriteAuth({ signal }),
    params: { q: q || undefined, status: status || undefined },
  });
  return response.data;
}

export async function createKnowledgeSource(payload, { signal } = {}) {
  const response = await api.post(
    '/admin/knowledge-sources/',
    payload,
    withAppwriteAuth({ signal }),
  );
  return response.data;
}

export async function submitOfficialDocument(payload, { signal } = {}) {
  const response = await api.post('/official/documents/', payload, withAppwriteAuth({ signal }));
  return response.data;
}

export async function fetchOfficialInstitutions({ signal } = {}) {
  const response = await api.get('/official/institutions/', withAppwriteAuth({ signal }));
  return response.data;
}

function firstFieldMessage(container) {
  if (!container || typeof container !== 'object') return null;
  for (const value of Object.values(container)) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === 'string' && item.trim());
      if (first) return first.trim();
    }
  }
  return null;
}

export function getApiErrorMessage(error, fallback = 'The service is temporarily unavailable.') {
  const data = error?.response?.data;
  const envelope =
    data && typeof data === 'object' && !Array.isArray(data) && data.error ? data.error : null;

  // The error envelope carries a generic top-level message, so prefer a specific
  // field detail when the API supplied one.
  const fieldMessage = firstFieldMessage(envelope?.details);
  if (fieldMessage && fieldMessage !== envelope?.message) return fieldMessage;

  const candidates = [envelope?.message, data?.detail, data?.message];
  const firstString = candidates.find((value) => typeof value === 'string' && value.trim());
  if (firstString) return firstString;

  // Legacy/plain DRF field errors are objects. Keep the UI useful without
  // rendering an object as a React child or exposing a provider/network trace.
  const legacyMessage = firstFieldMessage(data);
  if (legacyMessage) return legacyMessage;

  return fallback;
}

export function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default api;
