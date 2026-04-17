import { getAccessToken, getRefreshToken } from './auth-token';
import { env } from './env';

type RequestConfig = {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  searchParams?: Record<string, string | number | boolean | undefined>;
};

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

function buildUrl(path: string, searchParams?: Record<string, string | number | boolean | undefined>) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = env.apiBaseUrl.replace(/\/+$/, '');
  const apiPrefix = '/api/v1';
  const normalizedBaseUrl = baseUrl.endsWith(apiPrefix) ? baseUrl : `${baseUrl}${apiPrefix}`;
  let url = `${normalizedBaseUrl}${normalizedPath}`;
  if (searchParams) {
    const entries = Object.entries(searchParams).filter(
      ([, v]) => v !== undefined && v !== '',
    ) as [string, string | number | boolean][];
    if (entries.length > 0) {
      const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
      url += `?${qs}`;
    }
  }
  return url;
}

async function request<T>({ method, path, body, searchParams }: RequestConfig): Promise<T> {
  const url = buildUrl(path, searchParams);
  const token = getAccessToken();
  const refresh = getRefreshToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(refresh ? { 'X-Refresh-Token': refresh } : {}),
  };
  const serializedBody =
    method === 'POST' ? JSON.stringify(body !== undefined ? body : {}) : undefined;
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(url, {
    method,
    headers,
    body: serializedBody,
  });

  const data = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    const serverMessage = extractErrorMessage(data);
    const fallbackMessage = `Request failed (${response.status})`;
    throw new Error(serverMessage || fallbackMessage);
  }

  return (data ?? {}) as T;
}

export const api = {
  get<T>(path: string, searchParams?: Record<string, string | number | boolean | undefined>) {
    return request<T>({ method: 'GET', path, searchParams });
  },
  post<T>(path: string, body?: unknown) {
    return request<T>({ method: 'POST', path, body });
  },
};
