import { api } from '@/src/lib/api';

import type { LoginPayload, LoginResponse } from './auth.types';

type RawLoginResponse = {
  success?: boolean;
  message?: string;
  code?: number;
  token?: string;
  data?: {
    token?: string;
  };
};

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      const response = await api.post<RawLoginResponse>('/auth/login', payload);
      const isSuccess =
        response.success === true || response.code === 1001 || !!response.token || !!response.data?.token;

      return {
        success: isSuccess,
        message: response.message ?? '',
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
};
