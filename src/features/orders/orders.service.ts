import { api } from '@/src/lib/api';

import type { CreateOrderMetadataResponse, StoreOrderApiResponse, StoreOrderPayload } from './orderCreate.types';
import type {
  CommissionHistoryApiResponse,
  ListOrdersApiResponse,
  OrderDetailApiResponse,
  OrderStatusesApiResponse,
} from './orders.types';

export const ordersService = {
  listMine(params?: { limit?: number }) {
    const limit = params?.limit;
    return api.get<ListOrdersApiResponse>('/orders', limit !== undefined ? { limit } : undefined);
  },

  search(params: { q: string; limit?: number }) {
    const q = params.q.trim();
    const limit = params.limit;
    return api.get<ListOrdersApiResponse>(
      '/orders/search',
      limit !== undefined ? { q, limit } : { q },
    );
  },

  statuses() {
    return api.get<OrderStatusesApiResponse>('/orders/statuses');
  },

  historyCommission() {
    return api.get<CommissionHistoryApiResponse>('/order/history-commission');
  },

  detail(orderId: number | string) {
    return api.get<OrderDetailApiResponse>(`/orders/${orderId}`);
  },

  fetchCreateMetadata() {
    return api.get<CreateOrderMetadataResponse>('/orders/create');
  },

  createOrder(payload: StoreOrderPayload) {
    return api.post<StoreOrderApiResponse>('/orders', payload);
  },
};
