import { env } from './env';

type RequestConfig = {
  method: 'POST';
  path: string;
  body?: unknown;
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
  return '';
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = env.apiBaseUrl.replace(/\/+$/, '');
  const apiPrefix = '/api/v1';
  const normalizedBaseUrl = baseUrl.endsWith(apiPrefix) ? baseUrl : `${baseUrl}${apiPrefix}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

async function request<T>({ method, path, body }: RequestConfig): Promise<T> {
  const url = buildUrl(path);
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
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
  post<T>(path: string, body?: unknown) {
    return request<T>({ method: 'POST', path, body });
  },
};
