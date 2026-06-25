import { api } from '@/src/lib/api';

import type { ChildAgentsResponse } from './agents.types';
import type { ListOrdersApiResponse } from '@/src/features/orders/orders.types';

export const agentsService = {
  listChildren(params?: { agent_type_id?: number }) {
    const agentTypeId = params?.agent_type_id;
    return api.get<ChildAgentsResponse>(
      '/agents/children',
      agentTypeId !== undefined ? { agent_type_id: agentTypeId } : undefined,
    );
  },

  listChildOrders(
    agentId: number,
    params?: { q?: string; limit?: number; page?: number },
  ) {
    const query: Record<string, number | string> = {};
    if (params?.q?.trim()) query.q = params.q.trim();
    if (params?.limit !== undefined) query.limit = params.limit;
    if (params?.page !== undefined) query.page = params.page;

    return api.get<ListOrdersApiResponse>(
      `/agents/children/${agentId}/orders`,
      Object.keys(query).length > 0 ? query : undefined,
    );
  },
};
