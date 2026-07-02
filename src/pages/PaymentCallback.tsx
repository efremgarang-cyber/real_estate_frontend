import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) {
      window.location.href = '/dashboard?payment=failed';
      return;
    }

    api.get(`/paystack/verify?reference=${reference}`)
      .then(res => {
        if (res.data.success) {
          // Force a fresh load of the escrow page – bypass any cache
          window.location.href = `/escrow/${res.data.escrow_id}?_t=${Date.now()}`;
        } else {
          window.location.href = '/dashboard?payment=failed';
        }
      })
      .catch(() => {
        window.location.href = '/dashboard?payment=failed';
      });
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" /><p>Verifying your payment...</p></div>
    </div>
  );
};