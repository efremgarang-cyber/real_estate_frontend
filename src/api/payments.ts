import { api } from '../lib/api';

export interface InitiatePaymentPayload {
  property_id: number;
  phone_number: string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  message: string;
  CheckoutRequestID: string; // The Safari ID required to track payment state
  amount: number;
}

export interface PaymentStatusResponse {
  status: 'pending' | 'completed' | 'failed';
}

export const paymentsApi = {
  /**
   * Fire Safaricom STK Push
   */
  initiate: async (payload: InitiatePaymentPayload): Promise<InitiatePaymentResponse> => {
    const response = await api.post<InitiatePaymentResponse>('/payments/initiate', payload);
    return response.data;
  },

  /**
   * Query current payment callback status manually/polling
   */
  checkStatus: async (checkoutRequestId: string): Promise<PaymentStatusResponse> => {
    const response = await api.get<PaymentStatusResponse>(`/payments/status/${checkoutRequestId}`);
    return response.data;
  }
};