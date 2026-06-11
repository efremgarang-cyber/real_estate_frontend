import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion'; // ✅ Fixed: Import from standard framer-motion/motion alias if required
import { escrowApi } from '../../api/escrow';
import { Escrow } from '../../types';
import { cn, formatCurrency } from '../../lib/utils'; 
import { Skeleton } from '../../components/ui/skeleton';

export const EscrowsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEscrows();
  }, []);

  const fetchEscrows = async () => {
    try {
      setLoading(true);
      const response = await escrowApi.getMyEscrows({ limit: 50 });
      // Support structural mapping variation arrays safely
      const dataArray = Array.isArray(response) ? response : response.data || [];
      setEscrows(dataArray);
    } catch (error) {
      console.error('Failed to fetch escrows:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      pending_funding: { label: 'Pending Funding', color: 'bg-yellow-100 text-yellow-700' },
      funded: { label: 'Funded', color: 'bg-blue-100 text-blue-700' },
      inspection: { label: 'Inspection', color: 'bg-indigo-100 text-indigo-700' },
      closing: { label: 'Closing', color: 'bg-purple-100 text-purple-700' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
      disputed: { label: 'Disputed', color: 'bg-red-100 text-red-700' },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700' },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const filteredEscrows = escrows.filter(escrow => {
    if (filter !== 'all' && escrow.status !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        escrow.id.toString().includes(searchLower) ||
        escrow.property?.title?.toLowerCase().includes(searchLower) ||
        `#${escrow.id}`.includes(searchLower)
      );
    }
    return true;
  });

  // ✅ FIXED: Safely convert database string values to absolute operational numbers
  const stats = {
    total: escrows.reduce((sum, e) => {
      const parsedAmount = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;
      return sum + (isNaN(parsedAmount) ? 0 : parsedAmount);
    }, 0),
    active: escrows.filter(e => !['completed', 'cancelled', 'disputed'].includes(e.status)).length,
    completed: escrows.filter(e => e.status === 'completed').length,
  };

  if (loading) {
    return <EscrowsListSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#141414]">Escrow Management</h1>
        <p className="text-gray-500 mt-1">Track and manage all your escrow transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Escrow Value</p>
          <p className="text-2xl font-bold text-[#141414]">{formatCurrency(stats.total)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Active Escrows</p>
          <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Completed Escrows</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by escrow ID or property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
          />
        </div>
        <select title="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
        >
          <option value="all">All Status</option>
          <option value="pending_funding">Pending Funding</option>
          <option value="funded">Funded</option>
          <option value="inspection">Inspection</option>
          <option value="closing">Closing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Escrows List */}
      <div className="space-y-3">
        {filteredEscrows.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <ShieldCheck className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500">No escrows found</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-sm text-[#141414] underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredEscrows.map((escrow) => {
            const badge = getStatusBadge(escrow.status);
            // Convert localized display elements safely too
            const displayAmount = typeof escrow.amount === 'string' ? parseFloat(escrow.amount) : escrow.amount;

            return (
              <div
                key={escrow.id}
                onClick={() => navigate(`/escrow/${escrow.id}`)}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-semibold text-[#141414]">Escrow #{escrow.id}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", badge.color)}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {escrow.property?.title || `Property #${escrow.property_id}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created {new Date(escrow.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#141414]">{formatCurrency(isNaN(displayAmount) ? 0 : displayAmount)}</p>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="bg-[#141414] h-1.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: escrow.status === 'completed' ? '100%' : 
                                   escrow.status === 'funded' ? '100%' : 
                                   escrow.status === 'inspection' ? '60%' : 
                                   escrow.status === 'closing' ? '80%' : '40%' 
                          }}
                        />
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

// Skeleton Component
const EscrowsListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="flex gap-4">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
};