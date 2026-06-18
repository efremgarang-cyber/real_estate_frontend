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
import { EscrowWithProgress } from '../../types'; // Unified types system
import { Skeleton } from '../ui/skeleton'; 

interface EscrowProgressTrackerProps {
  escrowId: number;
  onPaymentClick?: (escrow: EscrowWithProgress) => void;
}

// 1. Core Component Layout Visual Presets
const stageConfig = {
  pending_funding: { label: 'Awaiting Payment', icon: CreditCard, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  funded: { label: 'Funds Secured', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  inspection: { label: 'Inspection Period', icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  closing: { label: 'Closing Process', icon: FileCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  disputed: { label: 'Disputed', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

// 2. Map backend-defined string keys cleanly to matching professional Lucide components
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
    // 👇 Guard Clause: Prevent API calls if the ID is falsy or uninitialized
    if (!escrowId || escrowId === 0) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [escrowId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Read responses directly without appending duplicate .data structures
      const [resolvedEscrow, resolvedTimeline] = await Promise.all([
        escrowApi.getById(escrowId) as Promise<EscrowWithProgress>,
        escrowApi.getTimeline(escrowId) as Promise<any>
      ]);

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

  // Verify structural validity of internal layout params
  if (error || !dataWrapper || !dataWrapper.escrow) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
        <p className="text-red-600 font-medium">{error || 'Escrow not found'}</p>
      </div>
    );
  }

  // Safely unwrap metrics data layout parameters
  const { escrow, progress, total_paid, remaining, is_fully_funded } = dataWrapper;

  // Prevent NaN values by parsing potential backend decimal string expressions
  const safeTotalAmount = typeof escrow.amount === 'string' ? parseFloat(escrow.amount) : escrow.amount;
  const numericTotalAmount = isNaN(safeTotalAmount) ? 0 : safeTotalAmount;
  const numericTotalPaid = typeof total_paid === 'string' ? parseFloat(total_paid) : total_paid || 0;
  const numericRemaining = typeof remaining === 'string' ? parseFloat(remaining) : remaining || 0;

  const currentStage = stageConfig[escrow.status as keyof typeof stageConfig] || stageConfig.pending_funding;

  return (
    <div className="space-y-6">
      {/* Header Info Section */}
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

      {/* Progress Metric Track */}
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

      {/* Financial Matrix Grid Layout */}
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

      {/* Dynamic Professional Timeline Section */}
      {timeline && timeline.stages && (
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

      {/* M-PESA / STK Push Payment Action Trigger */}
      {numericRemaining > 0 && escrow.status !== 'disputed' && (
        <button
          onClick={() => onPaymentClick?.(dataWrapper)}
          className="w-full bg-[#141414] text-white py-3 rounded-xl font-medium hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <CreditCard size={18} />
          Pay Remaining {formatCurrency(numericRemaining)}
        </button>
      )}

      {/* Automated Milestone Update Banner */}
      {is_fully_funded && escrow.status === 'funded' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="text-green-600 shrink-0" size={20} />
          <p className="text-sm text-green-700 font-medium">Escrow fully funded! Moving to inspection verification period.</p>
        </div>
      )}
    </div>
  );
};

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