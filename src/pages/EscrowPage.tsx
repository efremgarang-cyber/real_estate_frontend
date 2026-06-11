import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { EscrowProgressTracker } from '../../components/Escrow/EscrowProgressTracker';
import { escrowApi } from '../../api/escrow';
import { EscrowWithProgress } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const EscrowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [escrow, setEscrow] = useState<EscrowWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEscrow();
    }
  }, [id]);

  const fetchEscrow = async () => {
    try {
      setLoading(true);
      const data = await escrowApi.getById(parseInt(id!));
      setEscrow(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load escrow');
      console.error('Failed to fetch escrow:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
          <div className="h-96 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !escrow) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-[#141414] mb-2">Escrow Not Found</h2>
        <p className="text-gray-500 mb-6">{error || "The escrow you're looking for doesn't exist."}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#141414] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-black transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-[#141414] transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        <span className="text-sm">Back</span>
      </button>

      {/* Escrow Progress Tracker */}
      <EscrowProgressTracker
        escrowId={escrow.id!}
        onPaymentClick={() => {
          // Handle payment - you can open a payment modal or navigate to payment page
          console.log('Open payment for escrow:', escrow.id);
        }}
      />

      {/* Terms Section */}
      {escrow.terms && (
        <div className="mt-8 bg-gray-50 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Terms & Conditions</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{escrow.terms}</p>
        </div>
      )}
    </motion.div>
  );
};