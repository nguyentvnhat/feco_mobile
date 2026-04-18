import { api } from '@/src/lib/api';

import type { ChildAgentsResponse } from './agents.types';

export const agentsService = {
  listChildren(params?: { agent_type_id?: number }) {
    const agentTypeId = params?.agent_type_id;
    return api.get<ChildAgentsResponse>(
      '/agents/children',
      agentTypeId !== undefined ? { agent_type_id: agentTypeId } : undefined,
    );
  },
};
