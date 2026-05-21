import { api } from '../lib/api';
import { Property, CreatePropertyPayload, UpdatePropertyPayload, PAGINATED_RESPONSE } from '../types';

export const propertyApi = {
  getAll: async (page = 1): Promise<PAGINATED_RESPONSE<Property>> => {
    const response = await api.get<PAGINATED_RESPONSE<Property>>(`/v1/properties?page=${page}`);
    return response.data;
  },

  getById: async (id: string | number): Promise<{ data: Property }> => {
    const response = await api.get<{ data: Property }>(`/v1/properties/${id}`);
    return response.data;
  },

  create: async (payload: CreatePropertyPayload): Promise<{ data: Property }> => {
    const response = await api.post<{ data: Property }>('/v1/properties', payload);
    return response.data;
  },

  update: async (id: string | number, payload: UpdatePropertyPayload): Promise<{ data: Property }> => {
    const response = await api.put<{ data: Property }>(`/v1/properties/${id}`, payload);
    return response.data;
  },
};