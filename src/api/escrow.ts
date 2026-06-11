import { api } from '../lib/api';
// ✅ Import strictly from your central global unified types system
import { 
  Escrow, 
  EscrowWithProgress, 
  CreateEscrowPayload, 
  MilestonePayload, 
  EscrowMilestone,
  EscrowTimelineResponse
} from '../types';

export const escrowApi = {
  // Create a brand new contract instance
  create: async (payload: CreateEscrowPayload): Promise<Escrow> => {
    const response = await api.post('/escrow', payload);
    return response.data.data || response.data;
  },

  // Get single record details along with inner progress calculations
  getById: async (id: number): Promise<EscrowWithProgress> => {
    const response = await api.get(`/escrow/${id}`);
    return response.data.data || response.data;
  },

  // Get milestone stage history tracking pipelines
  getTimeline: async (id: number): Promise<EscrowTimelineResponse> => {
    const response = await api.get(`/escrow/${id}/timeline`);
    return response.data.data || response.data;
  },

  // Fetch all transactions bound to the current authenticated active user profile
  getMyEscrows: async (params?: { page?: number; limit?: number }): Promise<{ data: Escrow[]; total: number }> => {
    const response = await api.get('/my-escrows', { params });
    return response.data.data || response.data;
  },

  // Add individual deliverables / milestone components
  addMilestone: async (escrowId: number, payload: MilestonePayload): Promise<EscrowMilestone> => {
    const response = await api.post(`/escrow/${escrowId}/milestones`, payload);
    return response.data.data || response.data;
  },

  // Approve a completed stage segment 
  approveMilestone: async (escrowId: number, milestoneId: number): Promise<EscrowMilestone> => {
    const response = await api.post(`/escrow/${escrowId}/milestones/${milestoneId}/approve`);
    return response.data.data || response.data;
  },

  // Authorize releasing funds to target destination asset accounts
  releaseMilestone: async (escrowId: number, milestoneId: number): Promise<EscrowMilestone> => {
    const response = await api.post(`/escrow/${escrowId}/milestones/${milestoneId}/release`);
    return response.data.data || response.data;
  },

  // Dispatch M-PESA STK Push or Mastercard payloads to the clearing endpoints
  initializePayment: async (payload: {
    escrow_id: number;
    amount: number;
    payment_method: 'mpesa' | 'card';
    phone_number?: string;
    card_details?: {
      number: string;
      expiry: string;
      cvv: string;
    };
  }): Promise<any> => {
    const response = await api.post(`/escrow/${payload.escrow_id}/payments`, payload);
    return response.data.data || response.data;
  }
};