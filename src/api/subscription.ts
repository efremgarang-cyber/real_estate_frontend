import { api } from '../lib/api';

export interface SubscriptionTier {
  id: number;
  name: string;
  slug: string;
  monthly_price: number;
  yearly_price: number | null;
  max_properties: number;
  features: string[];
  is_active: boolean;
}

export interface CurrentSubscription {
  id?: number;
  status: string;
  plan: string;
  tier_slug?: string | null;
  max_properties: number;
  features: string[];
  starts_at?: string | null;
  ends_at?: string | null;
}


export interface MpesaSubscribeResponse {
  success: boolean;
  message: string;
  checkout_request_id: string;
  reference: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: 'pending' | 'completed' | 'failed';
  receipt_number?: string | null;
}

export const subscriptionApi = {
  getTiers: async (): Promise<SubscriptionTier[]> => {
    const response = await api.get('/subscriptions/tiers');
    return response.data;
  },

  getCurrent: async (): Promise<CurrentSubscription> => {
    const response = await api.get('/subscriptions/current');
    return response.data;
  },


  subscribeMpesa: async (
    tierSlug: string,
    billingCycle: 'monthly' | 'yearly',
    phone: string
  ): Promise<MpesaSubscribeResponse> => {
    const response = await api.post('/subscriptions/subscribe-mpesa', {
      tier_slug: tierSlug,
      billing_cycle: billingCycle,
      phone,
    });
    return response.data;
  },

  checkPaymentStatus: async (checkoutRequestId: string): Promise<PaymentStatusResponse> => {
    const response = await api.get(`/payments/status/${checkoutRequestId}`);
    return response.data;
  },
};