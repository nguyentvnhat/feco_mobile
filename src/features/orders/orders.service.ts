import { api } from '@/src/lib/api';

import type { CreateOrderMetadataResponse, StoreOrderApiResponse, StoreOrderPayload } from './orderCreate.types';
import type { ListOrdersApiResponse } from './orders.types';

export const ordersService = {
  listMine(params?: { limit?: number }) {
    const limit = params?.limit;
    return api.get<ListOrdersApiResponse>('/orders', limit !== undefined ? { limit } : undefined);
  },

  fetchCreateMetadata() {
    return api.get<CreateOrderMetadataResponse>('/orders/create');
  },

  createOrder(payload: StoreOrderPayload) {
    return api.post<StoreOrderApiResponse>('/orders', payload);
  },
};
