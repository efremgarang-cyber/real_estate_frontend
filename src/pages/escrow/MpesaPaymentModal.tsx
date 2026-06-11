import React, { useState } from 'react';
import { api } from '../../lib/api';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrowId: number;
  amount: number;
  onSuccess: () => void;
}

export const MpesaPaymentModal: React.FC<MpesaPaymentModalProps> = ({
  isOpen,
  onClose,
  escrowId,
  amount,
  onSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    try {
      // Call your existing M-Pesa STK push endpoint
      // Make sure your backend accepts 'escrow_id' and 'amount'
      const response = await api.post('/payments/stk-push', {
        phone_number: phoneNumber,
        amount: amount,
        escrow_id: escrowId,
        // If your backend expects a property_id, you may need to add it.
        // For escrow payments, we use property_id from the escrow.
        // Since we don't have property_id here, you may need to fetch it or adjust backend.
        // For now we pass a dummy property_id if required, but better to modify backend to accept escrow_id.
        property_id: 1, // temporary – you should fetch property_id from escrow or update backend
      });
      if (response.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.data.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">M-Pesa Payment</h2>
        <p className="text-gray-600 mb-4">
          Amount: <span className="font-bold text-green-600">KES {amount.toLocaleString()}</span>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 0712345678"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};