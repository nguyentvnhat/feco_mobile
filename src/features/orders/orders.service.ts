import { api } from '@/src/lib/api';

import type { ListOrdersApiResponse } from './orders.types';

export const ordersService = {
  listMine(params?: { limit?: number }) {
    const limit = params?.limit;
    return api.get<ListOrdersApiResponse>('/orders', limit !== undefined ? { limit } : undefined);
  },
};
