import { api } from '@/src/lib/api';

import type { LoginPayload, LoginResponse } from './auth.types';

export const authService = {
  login(payload: LoginPayload) {
    return api.post<LoginResponse>('/auth/login', payload);
  },
};
