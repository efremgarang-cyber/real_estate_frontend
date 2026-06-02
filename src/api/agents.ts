import { api } from '../lib/api';
import { Agent, CreateAgentPayload, APICollectionResponse } from '../types';

export interface UpdateAgentPayload {
  name?: string;
  email?: string;
  password?: string;
}

export const agentApi = {
  getAll: async (): Promise<APICollectionResponse<Agent>> => {
    const response = await api.get<APICollectionResponse<Agent>>('/v1/agents');
    return response.data;
  },

  create: async (payload: CreateAgentPayload): Promise<{ data: Agent }> => {
    const response = await api.post<{ data: Agent }>('/v1/agents', payload);
    return response.data;
  },

  update: async (id: number | string, payload: UpdateAgentPayload): Promise<{ data: Agent }> => {
    const response = await api.put<{ data: Agent }>(`/v1/agents/${id}`, payload);
    return response.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/v1/agents/${id}`);
  },
};