import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { escrowApi } from '../../api/escrow';
import { EscrowProgressTracker } from './EscrowProgressTracker';
import { EscrowMilestone } from './EscrowMilestone';
import { Escrow, EscrowStatus } from '../../types'; 
import { cn } from '../../lib/utils';
import { Skeleton } from '../ui/skeleton';

interface LeadEscrowTabProps {
  leadId: number;
  propertyId: number | string | null | undefined; 
  leadValue: number;
  leadName: string;
}

export const LeadEscrowTab: React.FC<LeadEscrowTabProps> = ({ 
  leadId, 
  propertyId, 
  leadValue, 
  leadName 
}) => {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [amount, setAmount] = useState<number | string>(leadValue);
  const [terms, setTerms] = useState('Standard 30-day escrow period');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedPropertyId = propertyId ? Number(propertyId) : null;

  const fetchEscrows = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const response = await escrowApi.getMyEscrows();
      
      // Explicit data-mapping serialization engine to neutralize type-casting fights
      const leadEscrows: Escrow[] = (response.data || [])
        .filter(
          (e: any) => parsedPropertyId !== null && Number(e.property_id) === parsedPropertyId
        )
        .map((e: any) => ({
          id: Number(e.id),
          property_id: Number(e.property_id),
          buyer_id: Number(e.buyer_id),
          seller_id: Number(e.seller_id),
          agency_id: Number(e.agency_id),
          amount: typeof e.amount === 'number' ? String(e.amount) : e.amount || '0',
          terms: e.terms || null,
          status: e.status as EscrowStatus,
          created_by: Number(e.created_by),
          created_at: e.created_at,
          updated_at: e.updated_at,
          milestones: e.milestones ? e.milestones.map((m: any) => ({
            id: Number(m.id),
            escrow_id: Number(m.escrow_id),
            name: m.name || m.title || 'Milestone Stage',
            title: m.title || m.name || 'Milestone Stage',
            description: m.description !== undefined && m.description !== null ? String(m.description) : null,
            amount: typeof m.amount === 'number' ? m.amount : parseFloat(m.amount) || 0,
            status: m.status as 'pending' | 'completed' | 'approved' | 'released',
            due_date: m.due_date || null,
            approved_at: m.approved_at || null,
            released_at: m.released_at || null,
            approved_by: m.approved_by ? Number(m.approved_by) : null,
            created_at: m.created_at,
            updated_at: m.updated_at,
          })) : []
        }));
      
      setEscrows(leadEscrows);
      
      if (leadEscrows.length > 0) {
        setSelectedEscrow(leadEscrows[0]);
      } else {
        setSelectedEscrow(null);
      }
    } catch (error) {
      console.error('Failed to fetch escrows:', error);
      setErrorMessage('Failed to connect to the secure escrow server database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrows();
  }, [leadId, propertyId]);

const handleCreateEscrow = async () => {
    if (!parsedPropertyId || isNaN(parsedPropertyId)) {
      setErrorMessage('Cannot initialize escrow: Lead profile is not tied to an active property asset listing.');
      return;
    }

    setCreating(true);
    setErrorMessage(null);
    try {
const newEscrow = await escrowApi.create({
  property_id: parsedPropertyId,
  amount: Number(amount),
  terms: terms,
  // If you have access to buyer/seller IDs from your lead object, you can pass them here:
  // buyer_id: lead.buyer_id,
  // seller_id: lead.seller_id,
});
      
      // Explicit formatting execution block for newly instantiated records back to string
      const typedEscrow: Escrow = {
        id: Number(newEscrow.id),
        property_id: Number(newEscrow.property_id),
        buyer_id: Number(newEscrow.buyer_id),
        seller_id: Number(newEscrow.seller_id),
        agency_id: Number(newEscrow.agency_id),
        amount: typeof newEscrow.amount === 'number' ? String(newEscrow.amount) : newEscrow.amount || '0',
        terms: newEscrow.terms || null,
        status: newEscrow.status as EscrowStatus,
        created_by: Number(newEscrow.created_by),
        created_at: newEscrow.created_at,
        updated_at: newEscrow.updated_at,
        milestones: newEscrow.milestones ? newEscrow.milestones.map((m: any) => ({
          id: Number(m.id),
          escrow_id: Number(m.escrow_id),
          name: m.name || m.title || 'Milestone Stage',
          title: m.title || m.name || 'Milestone Stage',
          description: m.description !== undefined && m.description !== null ? String(m.description) : null,
          amount: typeof m.amount === 'number' ? m.amount : parseFloat(m.amount) || 0,
          status: m.status as 'pending' | 'completed' | 'approved' | 'released',
          due_date: m.due_date || null,
          approved_at: m.approved_at || null,
          released_at: m.released_at || null,
          approved_by: m.approved_by ? Number(m.approved_by) : null,
          created_at: m.created_at,
          updated_at: m.updated_at,
        })) : []
      };
      
      setEscrows([typedEscrow, ...escrows]);
      setSelectedEscrow(typedEscrow);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create escrow:', error);
      setErrorMessage('Failed to register the escrow block with the backend ledger.');
    } finally {
      setCreating(false);
    }
  };
  if (loading) {
    return <LeadEscrowTabSkeleton />;
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
          <AlertCircle className="shrink-0 mt-0.5" size={16} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* No Escrow Created State */}
      {escrows.length === 0 && !showCreateForm && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-gray-400" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-[#141414] mb-2">No Escrow Created</h3>
          <p className="text-gray-500 text-sm mb-6">Secure the transaction workflow by initializing an escrow pipeline for {leadName}.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#141414] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-black transition-colors shadow-sm"
          >
            Create Escrow
          </button>
        </div>
      )}

      {/* Header with individual Escrow instance selector tabs */}
      {escrows.length > 0 && (
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex gap-2.5 overflow-x-auto">
            {escrows.map((escrow) => (
              <button
                key={escrow.id}
                onClick={() => setSelectedEscrow(escrow)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shrink-0",
                  selectedEscrow?.id === escrow.id
                    ? "bg-[#141414] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                Escrow #{escrow.id}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="text-sm flex items-center gap-1 text-gray-500 hover:text-[#141414] transition-colors ml-4"
          >
            <Plus size={16} />
            New
          </button>
        </div>
      )}

      {/* Create Escrow Transaction Layout Block Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4"
        >
          <h4 className="font-semibold text-[#141414]">Create New Escrow Agreement</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Amount (KES)
              </label>
              <input 
                title="amount"
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(e.target.value !== '' ? parseFloat(e.target.value) : '')}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#141414] text-sm font-bold text-[#141414]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Terms & Conditions
              </label>
              <textarea 
                title="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#141414] text-sm text-gray-600 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreateEscrow}
                disabled={creating || !amount || Number(amount) <= 0 || !parsedPropertyId}
                className="bg-[#141414] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-black disabled:opacity-50 transition-colors flex items-center gap-2 text-sm shadow-sm"
              >
                {creating && <Loader2 size={16} className="animate-spin" />}
                {creating ? 'Creating...' : 'Create Escrow'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="border border-gray-200 bg-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Escrow Progress & Milestone Analytics View */}
      {selectedEscrow && !showCreateForm && (
        <div className="space-y-8">
          {selectedEscrow.id && !isNaN(Number(selectedEscrow.id)) ? (
            <EscrowProgressTracker
              escrowId={selectedEscrow.id}
              onPaymentClick={() => {
                console.log('Open billing initialization payment interface modal for escrow:', selectedEscrow.id);
              }}
            />
          ) : (
            <div className="p-4 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium">
              Invalid computational data stream payload intercepted for active tracker indexing block parameters.
            </div>
          )}

          {/* Dynamic Milestones Render Tree */}
          {selectedEscrow.milestones && selectedEscrow.milestones.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Escrow Contract Milestones</h4>
              <div className="space-y-3">
                {selectedEscrow.milestones.map((milestone) => (
                  <EscrowMilestone
                    key={milestone.id}
                    milestone={milestone as any} // Cast safely to cross-match interface versions smoothly
                    escrowId={selectedEscrow.id}
                    userRole="buyer"
                    onUpdate={fetchEscrows}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LeadEscrowTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
        <Skeleton className="h-5 w-12" />
      </div>

      <div className="space-y-6">
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
            <div key={i} className="bg-gray-50 rounded-2xl p-4 text-center space-y-2">
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-6 w-24 mx-auto" />
            </div>
          ))}
        </div>

        <div>
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};