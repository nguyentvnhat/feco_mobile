import { env } from './env';

type RequestConfig = {
  method: 'POST';
  path: string;
  body?: unknown;
};

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${env.apiBaseUrl}/api/v1${normalizedPath}`;
}

async function request<T>({ method, path, body }: RequestConfig): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json().catch(() => null)) as T | null;
  if (!response.ok) {
    throw new Error('Request failed');
  }

  return (data ?? {}) as T;
}

export const api = {
  post<T>(path: string, body?: unknown) {
    return request<T>({ method: 'POST', path, body });
  },
};
