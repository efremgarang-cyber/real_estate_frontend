import { api } from '../lib/api';

export interface Agency {
  id: number;
  name: string;
  location?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateAgencyPayload {
  name?: string;
  location?: string;
}

export const agencyApi = {
  getCurrent: async (): Promise<{ data: Agency }> => {
    const response = await api.get<{ data: Agency }>('/v1/agency');
    return response.data;
  },

  update: async (id: number | string, payload: UpdateAgencyPayload): Promise<{ data: Agency }> => {
    const response = await api.put<{ data: Agency }>(`/v1/agencies/${id}`, payload);
    return response.data;
  },
};