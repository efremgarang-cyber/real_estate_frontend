import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { escrowApi } from '../../api/escrow';
import { Escrow } from '../../types/escrow';
import { formatCurrency, cn } from '../../lib/utils'; // ✅ Fixed: import cn from utils
import { Skeleton } from '../ui/skeleton';

export const EscrowOverview: React.FC = () => {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, funded: 0, pending: 0 });

  useEffect(() => {
    fetchEscrows();
  }, []);

  const fetchEscrows = async () => {
    try {
      setLoading(true);
      const response = await escrowApi.getMyEscrows({ limit: 5 });
      // ✅ Fixed: response.data is already the array? Check API return structure
      const escrowList = response.data || [];
      setEscrows(escrowList);
      
      const total = escrowList.reduce((sum: number, e: Escrow) => sum + e.amount, 0);
      const funded = escrowList
        .filter((e: Escrow) => e.status === 'funded')
        .reduce((sum: number, e: Escrow) => sum + e.amount, 0);
      
      setStats({ total, funded, pending: total - funded });
    } catch (error) {
      console.error('Failed to fetch escrows:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_funding': return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
      case 'funded': return { label: 'Funded', color: 'bg-blue-100 text-blue-700' };
      case 'inspection': return { label: 'Inspection', color: 'bg-indigo-100 text-indigo-700' };
      case 'closing': return { label: 'Closing', color: 'bg-purple-100 text-purple-700' };
      case 'completed': return { label: 'Completed', color: 'bg-green-100 text-green-700' };
      default: return { label: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="text-right">
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-1 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-4 ml-3" />
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (escrows.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-[#141414]" />
            <h3 className="font-semibold text-[#141414]">Active Escrows</h3>
          </div>
          <p className="text-2xl font-bold text-[#141414]">{formatCurrency(stats.total)}</p>
          <p className="text-xs text-gray-500">Total value in escrow</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp size={14} />
            <span className="text-sm font-medium">{formatCurrency(stats.funded)} funded</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Across {escrows.length} escrows</p>
        </div>
      </div>

      <div className="space-y-3">
        {escrows.slice(0, 3).map((escrow) => {
          const badge = getStatusBadge(escrow.status);
          return (
            <div
              key={escrow.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => window.location.href = `/escrow/${escrow.id}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#141414]">
                    Escrow #{escrow.id}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", badge.color)}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {escrow.property?.title || `Property #${escrow.property_id}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#141414]">{formatCurrency(escrow.amount)}</p>
                <div className="w-20 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="bg-[#141414] h-1 rounded-full"
                    style={{ width: escrow.status === 'funded' ? '100%' : '40%' }}
                  />
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400 ml-3" />
            </div>
          );
        })}
      </div>

      {escrows.length > 0 && (
        <button
          onClick={() => window.location.href = '/escrows'}
          className="w-full mt-4 text-center text-sm text-gray-500 hover:text-[#141414] transition-colors"
        >
          View all escrows →
        </button>
      )}
    </motion.div>
  );
};