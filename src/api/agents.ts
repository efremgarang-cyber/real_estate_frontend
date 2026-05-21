import { api } from '../lib/api';
import { Agent, CreateAgentPayload, APICollectionResponse } from '../types';

export const agentApi = {
  getAll: async (): Promise<APICollectionResponse<Agent>> => {
    const response = await api.get<APICollectionResponse<Agent>>('/v1/agents');
    return response.data;
  },

  create: async (payload: CreateAgentPayload): Promise<{ data: Agent }> => {
    const response = await api.post<{ data: Agent }>('/v1/agents', payload);
    return response.data;
  },
};