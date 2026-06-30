import { api as apiClient } from '../lib/api';


export const escrowApi = {
  /**
   * Fetch all escrow transactions
   */
  async getAll() {
    const response = await apiClient.get('/escrow');
    return response.data;
  },

  /**
   * Fetch escrows for current user (supports pagination and filters)
   */
  async getMyEscrows(params: { page?: number; limit?: number; status?: string } = {}) {
    const response = await apiClient.get('/escrow', { params });
    return response.data;
  },

  /**
   * Add a milestone to an escrow
   */
  async addMilestone(escrowId: string | number, data: { name: string; amount: number; description?: string }) {
    const response = await apiClient.post(`/escrow/${escrowId}/milestones`, data);
    return response.data;
  },

  /**
   * Approve a milestone (buyer action)
   * Accepts (escrowId, milestoneId) to match callers that pass both parameters.
   * escrowId is ignored server-side since the endpoint addresses the milestone directly.
   */
  async approveMilestone(_escrowId: string | number, milestoneId: string | number) {
    const response = await apiClient.post(`/escrow/milestones/${milestoneId}/approve`);
    return response.data;
  },

  /**
   * Release a milestone payout (server-side payout controller)
   * Note: backend route is /payouts/milestone/{id}/release
   */
  async releaseMilestone(_escrowId: string | number, milestoneId: string | number) {
    const response = await apiClient.post(`/payouts/milestone/${milestoneId}/release`);
    return response.data;
  },

  /**
   * Create / initialize an escrow (alias for initialize used by other components)
   */
  async create(data: Record<string, any>) {
    const response = await apiClient.post('/escrow', data);
    return response.data;
  },

  /**
   * Release escrow funds (alias stable name used in code)
   */
  async release(escrowId: string | number) {
    // Backend route: POST /escrow/{id}/release-funds
    const response = await apiClient.post(`/escrow/${escrowId}/release-funds`);
    return response.data;
  },

  /**
   * Refund escrow (alias)
   */
  async refund(escrowId: string | number) {
    // Best-effort: try escrow/{id}/refund then fallback to refundEscrow
    try {
      const response = await apiClient.post(`/escrow/${escrowId}/refund`);
      return response.data;
    } catch {
      return await (this as any).refundEscrow(escrowId);
    }
  },

  /**
   * Fetch a single escrow by ID
   */
  async getById(id: string | number) {
    const response = await apiClient.get(`/escrow/${id}`);
    return response.data;
  },

  /**
   * Fetch timeline for an escrow – if your backend doesn't have this,
   * return null so the component handles it gracefully.
   */
  async getTimeline(id: string | number) {
    try {
      const response = await apiClient.get(`/escrow/${id}/timeline`);
      return response.data;
    } catch {
      // Timeline not implemented – return null
      return null;
    }
  },

  /**
   * Initialize a new Escrow Agreement and get Paystack URL
   * Accepts optional escrowId for additional payments
   */
  async initialize(data: {
    clientEmail: string;
    providerEmail: string;
    providerPhone: string;
    amount: number;
    description?: string;
    escrowId?: string | number; // for additional payments
    leadId?: string;            // to track pipeline
  }) {
    const response = await apiClient.post('/escrow', data);
    return response.data;
  },

  /**
   * Verify a Paystack payment
   */
  async verifyPayment(reference: string) {
    const response = await apiClient.get(`/escrow/verify/${encodeURIComponent(reference)}`);
    return response.data;
  },

  /**
   * Initialize a deposit (for additional funding)
   */
   async initializeDeposit(data: { amount: number; email: string; escrow_id?: string | number }) {
     const response = await apiClient.post('/paystack/initialize', data);
     return response.data;
   },

  /**
   * Release funds from escrow
   */
  async releaseEscrow(id: string | number) {
    const response = await apiClient.post('/escrow/release', { id });
    return response.data;
  },

  /**
   * Refund escrow funds
   */
  async refundEscrow(id: string | number) {
    const response = await apiClient.post('/escrow/refund', { id });
    return response.data;
  },
};