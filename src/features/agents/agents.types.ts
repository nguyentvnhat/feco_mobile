export type ChildAgent = {
  id: number;
  code?: string | null;
  name?: string | null;
  city?: string | null;
  ward?: string | null;
  region?: string | null;
  status?: string | null;
};

export type ChildAgentsResponse = {
  success: boolean;
  message: string;
  data: {
    parent_agent?: {
      id: number;
      code?: string | null;
      name?: string | null;
      agent_type_id?: number | null;
    };
    agents: ChildAgent[];
  };
};
