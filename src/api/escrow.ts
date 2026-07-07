import { api } from '../lib/api';

export interface EscrowInitializeData {
  property_id: number;
  amount: number;
  terms?: string;
}

export interface DepositInitializeData {
  amount: number;
  escrowId?: number;
}

export const escrowApi = {
  getAll: async () => {
    const response = await api.get('/escrows');
    return response.data;
  },

  getMyEscrows: async (params?: { limit?: number }) => {
    const response = await api.get('/escrows/my-escrows', { params });
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/escrows/${id}`);
    return response.data;
  },

  getTimeline: async (id: string | number) => {
    try {
      const response = await api.get(`/escrows/${id}/timeline`);
      return response.data;
    } catch {
      return null;
    }
  },

  initialize: async (data: EscrowInitializeData) => {
    const response = await api.post('/escrows', data);
    return response.data;
  },

  verifyPayment: async (reference: string) => {
    const response = await api.get(`/escrows/verify/${reference}`);
    return response.data;
  },

  initializeDeposit: async (data: DepositInitializeData) => {
    const response = await api.post('/escrows/deposit', data);
    return response.data;
  },

  release: async (id: string | number) => {
    const response = await api.post(`/escrows/${id}/release`);
    return response.data;
  },

  refund: async (id: string | number) => {
    const response = await api.post(`/escrows/${id}/refund`);
    return response.data;
  },
};