import { api } from '@/src/lib/api';
import { clearSession, setAccessToken, setRefreshToken } from '@/src/lib/auth-token';

import type { LoginPayload, LoginResponse, MeResponse } from './auth.types';

type RawLoginResponse = {
  success?: boolean;
  message?: string;
  code?: number;
  token?: string;
  data?: {
    token?: string;
    refresh_token?: string;
    [key: string]: unknown;
  };
};

function extractAccessTokenFromEnvelope(raw: unknown): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const data = r.data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const t = d.token;
    if (typeof t === 'string' && t.trim()) return t.trim();
  }
  const root = r.token;
  if (typeof root === 'string' && root.trim()) return root.trim();
  return undefined;
}

function extractRefreshTokenFromEnvelope(raw: unknown): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const data = r.data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const t = d.refresh_token;
    if (typeof t === 'string' && t.trim()) return t.trim();
  }
  const root = r.refresh_token;
  if (typeof root === 'string' && root.trim()) return root.trim();
  return undefined;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      const response = await api.post<RawLoginResponse>('/auth/login', payload);

      if (!(response.success === true || response.code === 1001)) {
        return {
          success: false,
          message: response.message || 'Đăng nhập thất bại.',
        };
      }

      const access = extractAccessTokenFromEnvelope(response);
      const refresh = extractRefreshTokenFromEnvelope(response);

      if (!access) {
        return {
          success: false,
          message: 'Đăng nhập không trả về token. Kiểm tra phiên bản API.',
        };
      }

      setAccessToken(access);
      if (refresh) {
        setRefreshToken(refresh);
      }

      return {
        success: true,
        message: response.message ?? '',
        token: access,
      };
    } catch (error) {
      const fallbackMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      const rawMessage = error instanceof Error ? error.message.trim() : '';
      const isGenericNetworkError =
        rawMessage === 'Request failed' ||
        rawMessage === 'Network request failed' ||
        rawMessage === 'Failed to fetch' ||
        rawMessage.startsWith('Request failed (');

      return {
        success: false,
        message: rawMessage && !isGenericNetworkError ? rawMessage : fallbackMessage,
      };
    }
  },

  async me(): Promise<MeResponse> {
    return api.get<MeResponse>('/auth/me');
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await api.post<unknown>('/auth/logout', {});
      clearSession();
      return { success: true, message: '' };
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message.trim() : '';
      return {
        success: false,
        message: rawMessage || 'Đăng xuất thất bại.',
      };
    }
  },
};
