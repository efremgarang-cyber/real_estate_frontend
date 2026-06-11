import React, { useState } from 'react';
import { Check, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { escrowApi } from '../../api/escrow';
import { EscrowMilestone as MilestoneType } from '../../types/escrow';

interface EscrowMilestoneProps {
  milestone: MilestoneType;
  escrowId: number;
  userRole: 'buyer' | 'seller' | 'admin';
  onUpdate: () => void;
}

export const EscrowMilestone: React.FC<EscrowMilestoneProps> = ({ milestone, escrowId, userRole, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await escrowApi.approveMilestone(escrowId, milestone.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to approve milestone:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    setLoading(true);
    try {
      await escrowApi.releaseMilestone(escrowId, milestone.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to release milestone:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    switch (milestone.status) {
      case 'approved':
        return { label: 'Approved', color: 'text-blue-600', bg: 'bg-blue-50', icon: Check };
      case 'released':
        return { label: 'Released', color: 'text-green-600', bg: 'bg-green-50', icon: Check };
      default:
        return { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-[#141414]">{milestone.name}</h4>
          {milestone.description && (
            <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
          )}
        </div>
        <div className={cn("px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1", statusConfig.bg, statusConfig.color)}>
          <StatusIcon size={12} />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-gray-700">
          <DollarSign size={16} />
          <span className="font-semibold">{formatCurrency(milestone.amount)}</span>
        </div>

        {milestone.status === 'pending' && userRole === 'buyer' && (
          <button
            onClick={handleApprove}
            disabled={loading}
            className="text-sm bg-[#141414] text-white px-4 py-1.5 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Approve Milestone'}
          </button>
        )}

        {milestone.status === 'approved' && (userRole === 'seller' || userRole === 'admin') && (
          <button
            onClick={handleRelease}
            disabled={loading}
            className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Release Payment'}
          </button>
        )}

        {milestone.status === 'released' && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Check size={14} />
            Paid
          </span>
        )}
      </div>
    </div>
  );
};