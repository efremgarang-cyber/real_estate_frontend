import { api } from '../lib/api';
import { Agent, CreateAgentPayload, APICollectionResponse } from '../types';

export interface UpdateAgentPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export const agentApi = {
  getAll: async (): Promise<APICollectionResponse<Agent>> => {
    const response = await api.get<APICollectionResponse<Agent>>('/agents');
    return response.data;
  },

  create: async (payload: CreateAgentPayload): Promise<{ data: Agent }> => {
    const response = await api.post<{ data: Agent }>('/agents', payload);
    return response.data;
  },

  update: async (id: number | string, payload: UpdateAgentPayload): Promise<{ data: Agent }> => {
    const response = await api.put<{ data: Agent }>(`/agents/${id}`, payload);
    return response.data;
  },

  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/agents/${id}`);
  },
};