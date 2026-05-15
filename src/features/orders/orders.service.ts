import { api } from '@/src/lib/api';

import type {
  CreateOrderMetadataResponse,
  PreviewOrderApiResponse,
  PreviewOrderPayload,
  StoreOrderApiResponse,
  StoreOrderPayload,
} from './orderCreate.types';
import type {
  CommissionHistoryApiResponse,
  ListOrdersApiResponse,
  OrderDetailApiResponse,
  OrderStatusesApiResponse,
} from './orders.types';

export const ordersService = {
  listMine(params?: { limit?: number; page?: number }) {
    const query: Record<string, number> = {};
    if (params?.limit !== undefined) query.limit = params.limit;
    if (params?.page !== undefined) query.page = params.page;
    return api.get<ListOrdersApiResponse>('/orders', Object.keys(query).length > 0 ? query : undefined);
  },

  search(params: { q: string; limit?: number; page?: number }) {
    const q = params.q.trim();
    const query: Record<string, number | string> = { q };
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.page !== undefined) query.page = params.page;
    return api.get<ListOrdersApiResponse>('/orders/search', query);
  },

  statuses() {
    return api.get<OrderStatusesApiResponse>('/orders/statuses');
  },

  historyCommission(params?: {
    month?: string;
    status?: 'pending' | 'approved' | 'paid' | 'rejected';
    limit?: number;
  }) {
    return api.get<CommissionHistoryApiResponse>('/order/history-commission', params);
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

  previewOrder(payload: PreviewOrderPayload) {
    return api.post<PreviewOrderApiResponse>('/orders/preview', payload);
  },
};
