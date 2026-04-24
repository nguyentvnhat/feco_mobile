import axios, { isAxiosError, type AxiosError } from 'axios';

import { getAccessToken, getRefreshToken } from './auth-token';
import { env } from './env';
import { clearAllSession } from './secure-session';
import { ensureSessionReadyForRequest } from './session-hydration';
import { notifySessionInvalidated } from './session-invalidated';

const apiPrefix = '/api/v1';
const baseUrl = env.apiBaseUrl.replace(/\/+$/, '');
const normalizedBaseUrl = baseUrl.endsWith(apiPrefix) ? baseUrl : `${baseUrl}${apiPrefix}`;

function extractErrorMessage(data: unknown) {
  if (!data || typeof data !== 'object') return '';
  const candidate = data as Record<string, unknown>;

  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message;
  }
  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error;
  }
  if (candidate.error && typeof candidate.error === 'object') {
    const nestedError = candidate.error as Record<string, unknown>;
    if (typeof nestedError.message === 'string' && nestedError.message.trim()) {
      return nestedError.message;
    }
  }
  if (candidate.errors && typeof candidate.errors === 'object') {
    const errors = candidate.errors as Record<string, unknown>;
    for (const msgs of Object.values(errors)) {
      if (Array.isArray(msgs) && msgs.length > 0 && typeof msgs[0] === 'string') {
        return msgs[0];
      }
    }
  }
  return '';
}

function toRequestError(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data;
  const serverMessage = extractErrorMessage(data);
  const fallbackMessage = status ? `Request failed (${status})` : 'Request failed';
  const requestError = new Error(serverMessage || fallbackMessage) as Error & {
    status?: number;
    responseData?: unknown;
    fieldErrors?: Record<string, string[]>;
  };
  requestError.status = status;
  requestError.responseData = data;
  if (data && typeof data === 'object') {
    const candidate = data as Record<string, unknown>;
    if (candidate.errors && typeof candidate.errors === 'object') {
      const raw = candidate.errors as Record<string, unknown>;
      const normalized: Record<string, string[]> = {};
      for (const [key, val] of Object.entries(raw)) {
        if (Array.isArray(val)) {
          normalized[key] = val.filter((m): m is string => typeof m === 'string');
        } else if (typeof val === 'string' && val.trim()) {
          normalized[key] = [val];
        }
      }
      requestError.fieldErrors = normalized;
    }
  }
  return requestError;
}

export const apiClient = axios.create({
  baseURL: normalizedBaseUrl,
  headers: {
    Accept: 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

apiClient.interceptors.request.use(async (config) => {
  await ensureSessionReadyForRequest(config.url);

  const token = getAccessToken();
  const refresh = getRefreshToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  if (refresh) {
    config.headers['X-Refresh-Token'] = refresh;
  } else {
    delete config.headers['X-Refresh-Token'];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? '';
      if (!url.includes('/auth/login')) {
        await clearAllSession();
        notifySessionInvalidated();
      }
    }
    if (isAxiosError(error)) {
      return Promise.reject(toRequestError(error));
    }
    return Promise.reject(error);
  },
);

export const api = {
  async get<T>(path: string, searchParams?: Record<string, string | number | boolean | undefined>) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const params =
      searchParams &&
      Object.fromEntries(
        Object.entries(searchParams).filter(([, v]) => v !== undefined && v !== ''),
      );
    const response = await apiClient.get<T>(normalizedPath, {
      params: params && Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  async post<T>(path: string, body?: unknown) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const response = await apiClient.post<T>(normalizedPath, body !== undefined ? body : {});
    return response.data;
  },
};
