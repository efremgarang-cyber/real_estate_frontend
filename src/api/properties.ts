import { api } from '../lib/api';
import { Property, CreatePropertyPayload, UpdatePropertyPayload, PAGINATED_RESPONSE } from '../types';

export const propertyApi = {
  // ── 💡 BACKWARD COMPATIBILITY ALIAS ──
  // Instantly satisfies the "propertyApi.getAll is not a function" error in Overview.tsx
  getAll: async (page = 1): Promise<PAGINATED_RESPONSE<Property>> => {
    return propertyApi.getAgencyProperties(page);
  },

  // ── PUBLIC: Used by LandingPage.tsx ──
  getAllPublic: async (page = 1): Promise<{ data: Property[] }> => {
    // Hits the public index route if exposed outside the agent auth block
    const response = await api.get<{ data: Property[] }>(`/properties?page=${page}`);
    return response.data;
  },

  getById: async (id: string | number): Promise<{ data: Property }> => {
    // Aligned to hit /api/v1/agent/properties/{id} matching your Laravel resource controller
    const response = await api.get<{ data: Property }>(`/agent/properties/${id}`);
    return response.data;
  },

  signImage: async (path: string) => {
    const response = await api.post('/agent/properties/shares/sign-images', { path });
    return response.data.signed_url || response.data.url; 
  },
  
  attachImage: async (id: string | number, path: string): Promise<any> => {
    const response = await api.post(`/agent/properties/${id}/images`, { url: path });
    return response.data;
  },
  
  // ── PRIVATE: Used by your Agent Dashboard ──
  getAgencyProperties: async (page = 1): Promise<PAGINATED_RESPONSE<Property>> => {
    // Hits /api/v1/agent/properties?page=1 perfectly matching the structure in routes/api.php
    const response = await api.get<PAGINATED_RESPONSE<Property>>(`/agent/properties?page=${page}`);
    return response.data;
  },

  create: async (payload: CreatePropertyPayload): Promise<{ data: Property }> => {
    // Aligned to hit POST /api/v1/agent/properties
    const response = await api.post<{ data: Property }>('/agent/properties', payload);
    return response.data;
  },

  update: async (id: string | number, payload: UpdatePropertyPayload): Promise<{ data: Property }> => {
    // Aligned to hit PUT /api/v1/agent/properties/{id}
    const response = await api.put<{ data: Property }>(`/agent/properties/${id}`, payload);
    return response.data;
  },

  delete: async (id: string | number): Promise<void> => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },
};