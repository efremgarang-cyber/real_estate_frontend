import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Shield,
  FileCheck,
  Home,
  AlertCircle,
  CreditCard,
  Search,
  CheckCircle2,
  LucideIcon
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { escrowApi } from '../../api/escrow';
import { Skeleton } from '../ui/skeleton';

// Inline type definition (since we don't have src/types/index.ts)
interface EscrowWithProgress {
  escrow: {
    id: number;
    clientName: string;
    client_email: string;
    providerName: string;
    provider_email: string;
    provider_phone: string;
    propertyTitle: string;
    amount: number;
    status: string;
    updated_at: string;
    payment_reference: string;
  };
  progress: number;
  total_paid: number;
  remaining: number;
  is_fully_funded: boolean;
}

interface EscrowProgressTrackerProps {
  escrowId: number;
  onPaymentClick?: (escrow: EscrowWithProgress) => void;
}

// Stage configurations
const stageConfig = {
  pending_payment: { label: 'Awaiting Payment', icon: CreditCard, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  held: { label: 'Funds Secured', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  inspection: { label: 'Inspection Period', icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  released: { label: 'Released', icon: FileCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  refunded: { label: 'Refunded', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  disputed: { label: 'Disputed', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

const backendIconMap: Record<string, LucideIcon> = {
  'dollar-sign': CreditCard,
  'lock': Shield,
  'search': Search,
  'file-text': FileCheck,
  'check-circle': CheckCircle2,
};

export const EscrowProgressTracker: React.FC<EscrowProgressTrackerProps> = ({ escrowId, onPaymentClick }) => {
  const [dataWrapper, setDataWrapper] = useState<EscrowWithProgress | null>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!escrowId || escrowId === 0) {
      setLoading(false);
      setError('No escrow selected');
      return;
    }
    fetchData();
  }, [escrowId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch escrow data using getById
      const resolvedEscrow = await escrowApi.getById(escrowId) as EscrowWithProgress;

      // Try to fetch timeline, but ignore if it fails
      let resolvedTimeline = null;
      try {
        resolvedTimeline = await escrowApi.getTimeline(escrowId);
      } catch {
        // Timeline not available
      }

      setDataWrapper(resolvedEscrow);
      setTimeline(resolvedTimeline);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load escrow details');
      console.error('Failed to load tracking analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <EscrowProgressSkeleton />;
  }

  if (error || !dataWrapper || !dataWrapper.escrow) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
        <p className="text-red-600 font-medium">{error || 'Escrow not found'}</p>
        <button
          onClick={fetchData}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { escrow, progress, total_paid, remaining, is_fully_funded } = dataWrapper;

  const safeTotalAmount = typeof escrow.amount === 'string' ? parseFloat(escrow.amount) : escrow.amount;
  const numericTotalAmount = isNaN(safeTotalAmount) ? 0 : safeTotalAmount;
  const numericTotalPaid = typeof total_paid === 'string' ? parseFloat(total_paid) : total_paid || 0;
  const numericRemaining = typeof remaining === 'string' ? parseFloat(remaining) : remaining || 0;

  const currentStage = stageConfig[escrow.status as keyof typeof stageConfig] || stageConfig.pending_payment;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Escrow Status</span>
          <h3 className="text-xl font-bold text-[#141414] mt-1">
            Escrow #{escrow.id}
          </h3>
        </div>
        <div className={cn("px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5", currentStage.bg, currentStage.color)}>
          <currentStage.icon size={14} />
          <span>{currentStage.label}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Progress</span>
          <span className="font-semibold text-[#141414]">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-[#141414] h-2 rounded-full"
          />
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
          <p className="text-base font-bold text-[#141414]">{formatCurrency(numericTotalAmount)}</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
          <p className="text-xs text-green-600 mb-1">Paid</p>
          <p className="text-base font-bold text-green-700">{formatCurrency(numericTotalPaid)}</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-4 text-center border border-yellow-100">
          <p className="text-xs text-yellow-600 mb-1">Remaining</p>
          <p className="text-base font-bold text-yellow-700">{formatCurrency(numericRemaining)}</p>
        </div>
      </div>

      {/* Timeline (conditional) */}
      {timeline && timeline.stages && timeline.stages.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Transaction Timeline</h4>
          <div className="space-y-4">
            {timeline.stages.map((stage: any) => {
              const LiveStageIcon = backendIconMap[stage.icon] || CreditCard;
              return (
                <div key={stage.stage} className="flex items-start gap-3.5 group">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 mt-0.5",
                    stage.completed
                      ? "bg-green-500 text-white"
                      : stage.active
                        ? "bg-[#141414] text-white"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                  )}>
                    {stage.completed ? (
                      <Check size={15} strokeWidth={3} />
                    ) : (
                      <LiveStageIcon size={14} />
                    )}
                  </div>
                  <div className="flex-1 border-b border-gray-50 pb-3 group-last:border-none">
                    <p className={cn(
                      "text-sm font-semibold transition-colors duration-200",
                      stage.active ? "text-[#141414]" : stage.completed ? "text-green-600" : "text-gray-400"
                    )}>
                      {stage.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {stage.active ? "Action required or current operation step" : stage.completed ? "Milestone verified and cleared" : "Awaiting previous pipeline phase"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Button */}
      {numericRemaining > 0 && escrow.status !== 'disputed' && escrow.status !== 'refunded' && (
        <button
          onClick={() => onPaymentClick?.(dataWrapper)}
          className="w-full bg-[#141414] text-white py-3 rounded-xl font-medium hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <CreditCard size={18} />
          Pay Remaining {formatCurrency(numericRemaining)}
        </button>
      )}

      {/* Fully Funded Banner */}
      {is_fully_funded && (escrow.status === 'held' || escrow.status === 'inspection') && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600 shrink-0" size={20} />
          <p className="text-sm text-green-700 font-medium">Escrow fully funded! Moving to inspection verification period.</p>
        </div>
      )}
    </div>
  );
};

// Skeleton loading component
const EscrowProgressSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 rounded-2xl p-4 text-center space-y-2 border border-gray-100">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="h-6 w-24 mx-auto" />
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <Skeleton className="h-5 w-36 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
};