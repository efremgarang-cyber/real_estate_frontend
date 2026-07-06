import { api } from '../lib/api';

export interface TransactionUser {
  id: number;
  name: string;
  email: string;
}

export interface Transaction {
  id: number;
  user: TransactionUser | null;
  escrow_id: number | null;
  subscription_id: number | null;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_type: 'escrow' | 'subscription' | null;
  payment_method: string;
  transaction_reference: string | null;
  receipt_number: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface TransactionListResponse {
  data: Transaction[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface TransactionFilters {
  status?: string;
  payment_method?: string;
  payment_type?: string;
  page?: number;
}

export const adminTransactionsApi = {
  list: async (filters: TransactionFilters = {}): Promise<TransactionListResponse> => {
    const response = await api.get<TransactionListResponse>('/admin/transactions', {
      params: filters,
    });
    return response.data;
  },

  updateStatus: async (
    paymentId: number,
    status: 'completed' | 'failed'
  ): Promise<{ success: boolean; message: string; payment: Transaction }> => {
    const response = await api.patch(`/admin/transactions/${paymentId}/status`, { status });
    return response.data;
  },

  // FIXED: Changed from window.open to an authenticated axios binary stream blob request
  export: async (filters: TransactionFilters = {}): Promise<Blob> => {
    const response = await api.get('/admin/transactions/export', {
      params: filters,
      responseType: 'blob', // CRITICAL: Tells axios not to parse the data as JSON string tokens
    });
    return response.data;
  },
};