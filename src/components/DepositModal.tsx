// 📁 File: src/components/DepositModal.tsx
import React, { useState } from 'react';
import { X, CreditCard, ArrowRight, Loader2 } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitializeDeposit: (amount: number) => Promise<string | null>;
  escrowId?: number;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onInitializeDeposit }) => {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    setError('Please enter a valid amount greater than 0.');
    return;
  }

  setLoading(true);
  try {
    // Pass escrowId to the callback
    const paymentUrl = await onInitializeDeposit(parsedAmount, escrowId);
    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      onClose(); 
      setAmount('');
    } else {
      setError('Could not retrieve payment link. Check backend server connection.');
    }
  } catch (err: any) {
    setError(err.message || 'An error occurred while initializing transaction.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Blur Backdrop Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={loading ? undefined : onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* TOP DECORATION: Overlapping Premium Cards Graphic */}
        <div className="relative h-32 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
          
          {/* Card Overlay Art */}
          <div className="relative w-full h-full flex items-center justify-center mt-6">
            <div className="absolute w-44 h-24 bg-neutral-800/60 rounded-xl border border-neutral-700/50 transform -rotate-12 translate-x-[-20px] translate-y-[10px] opacity-40 backdrop-blur-md" />
            <div className="absolute w-44 h-24 bg-gradient-to-tr from-neutral-800 to-neutral-700 rounded-xl shadow-lg border border-neutral-600/30 transform rotate-6 translate-x-[15px] p-3 flex flex-col justify-between text-white">
              <div className="flex justify-between items-start">
                <CreditCard size={18} className="text-gray-300" />
                <span className="text-[8px] tracking-widest text-gray-400 font-mono">MAKAO SECURE</span>
              </div>
              <div className="text-[10px] tracking-wider font-mono text-gray-300">•••• •••• •••• 2026</div>
            </div>
          </div>

          <button 
            type="button"
            disabled={loading}
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-neutral-900">Secure Vault Deposit</h3>
            <p className="text-xs text-gray-400 mt-1">Funds are managed via Paystack instant clearing</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Amount to Deposit (KES)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                Ksh
              </span>
              <input
                type="number"
                disabled={loading}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50,000"
                className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:bg-white text-gray-900 pl-12 pr-4 py-3 rounded-xl outline-none transition font-medium text-base disabled:opacity-60"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-950 text-white font-medium py-3 px-4 rounded-xl hover:bg-black transition flex items-center justify-center gap-2 mt-6 shadow-md disabled:bg-neutral-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generating Secure Link...</span>
              </>
            ) : (
              <>
                <span>Continue to Paystack</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};