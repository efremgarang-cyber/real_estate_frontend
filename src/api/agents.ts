import { api } from '../lib/api';
import { User } from '../types'; 

export interface CreateAgentPayload {
  name: string;
  email: string;
  password?: string;
}

export interface UpdateAgentPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'agent';
}

export const agentApi = {
  /**
   * Fetch all agents belonging to the authenticated user's agency.
   */
  getAll: async (): Promise<User[]> => {
    const response = await api.get<{ data: User[] }>('/agents');
    return response.data.data;
  },

  /**
   * Create a new agent within the agency.
   */
  create: async (payload: CreateAgentPayload): Promise<User> => {
    const response = await api.post<{ data: User }>('/agents', payload);
    return response.data.data;
  },

  /**
   * Update an existing agent's details.
   */
  update: async (id: string | number, payload: UpdateAgentPayload): Promise<User> => {
    const response = await api.put<{ data: User }>(`/agents/${id}`, payload);
    return response.data.data;
  },

  /**
   * Delete an agent from the agency.
   */
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/agents/${id}`);
  }
};