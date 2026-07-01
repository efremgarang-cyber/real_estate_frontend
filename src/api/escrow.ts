import axios from 'axios';

// API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Add Bearer token if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const escrowApi = {
  /**
   * Fetch all escrow transactions (used in the table)
   */
  async getAll() {
    const response = await apiClient.get('/escrow');
    return response.data;
  },

  /**
   * Fetch a single escrow by ID (used in the progress tracker)
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
  async initializeDeposit(data: { amount: number; email: string }) {
    const response = await apiClient.post('/deposit/initialize', data);
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