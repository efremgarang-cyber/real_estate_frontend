import { api } from '../lib/api';
import { Lead, CreateLeadPayload, UpdateLeadPayload, PAGINATED_RESPONSE, SuccessMessage } from '../types';

export const leadApi = {
  getAll: async (page = 1): Promise<PAGINATED_RESPONSE<Lead>> => {
    const response = await api.get<PAGINATED_RESPONSE<Lead>>(`/leads?page=${page}`);
    return response.data;
  },

  getById: async (id: string | number): Promise<{ data: Lead }> => {
    const response = await api.get<{ data: Lead }>(`/leads/${id}`);
    return response.data;
  },

  create: async (payload: CreateLeadPayload): Promise<{ data: Lead }> => {
    const response = await api.post<{ data: Lead }>('/leads', payload);
    return response.data;
  },

  update: async (id: string | number, payload: UpdateLeadPayload): Promise<{ data: Lead }> => {
    const response = await api.put<{ data: Lead }>(`/leads/${id}`, payload);
    return response.data;
  },

  // LeadKanbanController - For fluid stage progression shifts
  updateKanbanStage: async (id: string | number, stage: string): Promise<{ message: string; data: Lead }> => {
    const response = await api.patch<{ message: string; data: Lead }>(`/leads/${id}/kanban`, {
      kanban_stage: stage,
    });
    return response.data;
  },
};