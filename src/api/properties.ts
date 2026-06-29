import { api } from '../lib/api';
import { Property, CreatePropertyPayload, UpdatePropertyPayload, PAGINATED_RESPONSE } from '../types';

export const propertyApi = {
  // ── PUBLIC: Used by LandingPage.tsx ──
  getAllPublic: async (page = 1): Promise<{ data: Property[] }> => {
    // Note: Public index returns a flat array based on your controller, not a paginated resource
    const response = await api.get<{ data: Property[] }>(`/properties?page=${page}`);
    return response.data;
  },

  getById: async (id: string | number): Promise<{ data: Property }> => {
    const response = await api.get<{ data: Property }>(`/properties/${id}`);
    return response.data;
  },

  signImage: async (path: string) => {
    const response = await api.post('/properties/shares/sign-images', { path });
    return response.data.signed_url || response.data.url; 
  },
  
  // Send the path under the 'url' payload key to match the Laravel controller expectation
  attachImage: async (id: string | number, path: string): Promise<any> => {
    const response = await api.post(`/properties/${id}/images`, { url: path });
    return response.data;
  },
  
  // ── PRIVATE: Used by your Agent Dashboard ──
  getAgencyProperties: async (page = 1): Promise<PAGINATED_RESPONSE<Property>> => {
    const response = await api.get<PAGINATED_RESPONSE<Property>>(`/agent/properties?page=${page}`);
    return response.data;
  },

  create: async (payload: CreatePropertyPayload): Promise<{ data: Property }> => {
    const response = await api.post<{ data: Property }>('/properties', payload);
    return response.data;
  },

  update: async (id: string | number, payload: UpdatePropertyPayload): Promise<{ data: Property }> => {
    const response = await api.put<{ data: Property }>(`/properties/${id}`, payload);
    return response.data;
  },

  delete: async (id: string | number): Promise<void> => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },
};