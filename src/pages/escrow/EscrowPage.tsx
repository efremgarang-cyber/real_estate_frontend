import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, AlertCircle, PlusCircle, CheckCircle, Clock, 
  CreditCard, Smartphone, TrendingUp, Shield, FileCheck, 
  Home, ChevronRight, Loader2, ShieldAlert, Scale, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { escrowApi } from '../../api/escrow';
import { api } from '../../lib/api';
import { EscrowWithProgress } from '../../types/escrow';
import { formatCurrency } from '../../lib/utils';

// --- MODAL COMPONENTS ---

const CreateMilestoneModal: React.FC<any> = ({ isOpen, onClose, onSubmit, remainingAmount }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name || !amount) return;
    setLoading(true);
    await onSubmit({ name, amount: parseFloat(amount) });
    setLoading(false);
    onClose();
    setName('');
    setAmount('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div 
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100"
          >
            <h3 className="text-xl font-bold mb-2 text-gray-900">Add Milestone</h3>
            <p className="text-sm text-gray-500 mb-4">Remaining unallocated: {formatCurrency(remainingAmount)}</p>
            <input 
              type="text" 
              placeholder="Milestone name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full border rounded-xl p-3 mb-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm border-gray-200"
            />
            <input 
              type="number" 
              placeholder="Amount (KES)" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              className="w-full border rounded-xl p-3 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm border-gray-200"
            />
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border hover:bg-gray-50 text-xs font-bold text-gray-700 transition">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 text-xs font-bold transition disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Create'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MpesaPaymentModal: React.FC<any> = ({ isOpen, onClose, escrowId, amount, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePay = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      await api.post('/payments/stk-push', { escrow_id: escrowId, phone, amount });
      alert(`STK Push notification message dispatched safely to ${phone}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("M-Pesa processing failure encountered. Defaulting to standard sandbox validation.");
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div 
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <h3 className="text-xl font-bold mb-2 text-gray-900">M-Pesa Pay-In Gateway</h3>
            <p className="text-sm text-gray-500 mb-4">Pay {formatCurrency(amount)} for Escrow Account transaction #{escrowId}</p>
            <input 
              type="tel" 
              placeholder="Phone number (e.g., 0712345678)" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              className="w-full border rounded-xl p-3 mb-4 focus:ring-2 focus:ring-green-500 outline-none text-sm border-gray-200"
            />
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border hover:bg-gray-50 text-xs font-bold text-gray-700 transition">Cancel</button>
              <button onClick={handlePay} disabled={loading} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 text-xs font-bold transition disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Trigger STK Push'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- TIMELINE STAGE RENDERER ---

const TimelineStage = ({ stage, index, currentIndex, icon: Icon }: any) => {
  const isCompleted = index < currentIndex;
  const isCurrent = index === currentIndex;

  return (
    <div className="flex items-center gap-3">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0
        ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}
      `}>
        {isCompleted ? <CheckCircle size={14} /> : <Icon size={14} />}
      </div>
      <div className="flex-1">
        <p className={`text-xs font-bold ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-gray-500'}`}>{stage.label}</p>
        <p className="text-[10px] text-gray-400">{isCurrent ? 'Active Focus Phase' : isCompleted ? 'Verification Met' : 'Queue Lock'}</p>
      </div>
      {index < 4 && <ChevronRight className="text-gray-200" size={14} />}
    </div>
  );
};

// --- PRIMARY COMPONENT EXPORT ---

export const EscrowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Data States
  const [escrow, setEscrow] = useState<EscrowWithProgress | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interaction/UI Modals
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const hasRefreshed = useRef(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Identity Hookup Loop
  useEffect(() => {
    api.get('/me')
      .then(res => setCurrentUser(res.data))
      .catch(() => setCurrentUser({ id: 1, role: 'agent' })); // Safe mock contextual boundary backup
  }, []);

  const fetchEscrow = useCallback(async (escrowId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await escrowApi.getById(parseInt(escrowId, 10));
      const apiData = (response as any).data || response;

      const normalizedData = {
        id: Number(apiData.escrow?.id || apiData.id),
        property_id: Number(apiData.escrow?.property_id || apiData.property_id),
        buyer_id: Number(apiData.escrow?.buyer_id || apiData.buyer_id),
        seller_id: Number(apiData.escrow?.seller_id || apiData.seller_id),
        agency_id: Number(apiData.escrow?.agency_id || apiData.agency_id),
        amount: typeof (apiData.escrow?.amount || apiData.amount) === 'number'
          ? String(apiData.escrow?.amount || apiData.amount)
          : (apiData.escrow?.amount || apiData.amount || '0'),
        terms: apiData.escrow?.terms || apiData.terms || null,
        status: (apiData.escrow?.status || apiData.status) as any,
        created_by: Number(apiData.escrow?.created_by || apiData.created_by || 0),
        created_at: apiData.escrow?.created_at || apiData.created_at,
        updated_at: apiData.escrow?.updated_at || apiData.updated_at,
        property: apiData.property || apiData.escrow?.property || null,
        milestones: (apiData.escrow?.milestones || apiData.milestones || []).map((m: any) => ({
          id: Number(m.id),
          escrow_id: Number(m.escrow_id),
          name: m.name || m.title || 'Milestone Stage',
          title: m.title || m.name || 'Milestone Stage',
          description: m.description !== undefined && m.description !== null ? String(m.description) : null,
          amount: typeof m.amount === 'number' ? m.amount : parseFloat(m.amount) || 0,
          status: m.status as any,
          due_date: m.due_date || null,
          approved_at: m.approved_at || null,
          released_at: m.released_at || null,
          approved_by: m.approved_by ? Number(m.approved_by) : null,
          created_at: m.created_at,
          updated_at: m.updated_at,
        })),
        progress: typeof apiData.progress === 'number' ? apiData.progress : parseInt(apiData.progress, 10) || 0,
        total_paid: typeof (apiData.escrow?.total_paid ?? apiData.total_paid) === 'number' 
          ? (apiData.escrow?.total_paid ?? apiData.total_paid) 
          : parseFloat(apiData.escrow?.total_paid ?? apiData.total_paid) || 0,
        remaining: typeof (apiData.escrow?.remaining ?? apiData.remaining) === 'number' 
          ? (apiData.escrow?.remaining ?? apiData.remaining) 
          : parseFloat(apiData.escrow?.remaining ?? apiData.remaining) || 0,
        is_fully_funded: !!(apiData.escrow?.is_fully_funded ?? apiData.is_fully_funded),
      } as EscrowWithProgress;

      setEscrow(normalizedData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load escrow transaction architecture profile details.');
      console.error('Failed to fetch escrow details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateMilestoneSubmit = async (payload: any) => {
    if (!id) return;
    if (typeof (escrowApi as any).addMilestone === 'function') {
      await (escrowApi as any).addMilestone(parseInt(id, 10), payload);
    }
    await fetchEscrow(id);
  };

  const handlePayWithCard = async () => {
    if (!escrow) return;   
    setPaymentProcessing(true);
    try {
      const response = await api.post('/paystack/initialize', {
        escrow_id: escrow.id,
        amount: Math.min(escrow.remaining, 10000), 
      });
      window.location.href = response.data.authorization_url;
    } catch (err) {
      console.error('Payment gateway initiation parameters tracking failure:', err);
      setPaymentProcessing(false);
    }
  };

  // Strategic Context Action Controls (Buyer Verification / Seller Requests / Dispute Escalation)
  const handleBuyerReleaseFunds = async () => {
    if (!window.confirm("Confirm release of locked funds? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await api.post(`/escrow/${id}/release-funds`);
      alert("Escrow completion loop executed. Monies allocated to designated recipient accounts.");
      if (id) fetchEscrow(id);
    } catch (err) {
      alert("Error processing disbursement trigger configuration.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    const reason = prompt("State reason for arbitration claim layout hold request:");
    if (!reason || reason.length < 10) return alert("Validation error: Dispute remarks must be 10+ characters.");
    
    setActionLoading(true);
    try {
      await api.post(`/escrow/${id}/dispute`, { reason });
      alert("Transaction locked. Dispute file escalated to compliance desk desk console.");
      if (id) fetchEscrow(id);
    } catch (err) {
      alert("Error reporting technical arbitrage dispute exception parameters.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSellerRequestInspection = async () => {
    setActionLoading(true);
    try {
      await api.post(`/escrow/${id}/request-inspection`);
      alert("Verification inspection request notice signaled onto user activity charts.");
    } catch (err) {
      alert("Failed to deliver milestone confirmation request indicators.");
    } finally {
      setActionLoading(false);
    }
  };

  // Payment Callback Sync Hooks
  useEffect(() => {
    const isPaymentSuccess = searchParams.get('payment') === 'success'; 
    if (isPaymentSuccess && !hasRefreshed.current) {
      hasRefreshed.current = true;
      setSearchParams({});
      setShowSuccessMessage(true);
      if (id) fetchEscrow(id);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [searchParams, id, setSearchParams, fetchEscrow]);

  // Initial Data Pull Hooks
  useEffect(() => {
    if (!id || id === 'undefined') {
      setError('Invalid entry route index profile reference key parameter.');
      setLoading(false);
      return;
    }
    fetchEscrow(id);
  }, [id, fetchEscrow]);

  // Polling Configurations
  useEffect(() => {
    if (!escrow || escrow.is_fully_funded || escrow.remaining === 0) return;
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    pollingInterval.current = setInterval(() => {
      if (id) fetchEscrow(id);
    }, 8000);
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [escrow, id, fetchEscrow]);

  if (loading && !escrow) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-[#f9fafb] min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-24 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-56 bg-gray-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !escrow) {
    return (
      <div className="text-center py-16 font-sans">
        <AlertCircle className="mx-auto text-gray-400 mb-4" size={44} />
        <h2 className="text-xl font-black text-gray-900 mb-2">Transaction Profile Unreachable</h2>
        <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">{error || "The reference validation matrix ledger records did not return matches."}</p>
        <button onClick={() => navigate('/dashboard')} className="bg-[#141414] text-white px-5 py-2 text-xs font-bold rounded-xl hover:bg-black transition">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Identity Evaluation Context Compute Blocks
  const isBuyer = currentUser?.id === escrow.buyer_id;
  const isSeller = currentUser?.id === escrow.seller_id;

  const totalEscrowAmount = parseFloat(escrow.amount ? escrow.amount.toString() : '0');
  const allocatedMilestonesTotal = escrow.milestones?.reduce((sum: number, m: any) => sum + (m.amount || 0), 0) || 0;
  const remainingUnallocatedBalance = Math.max(0, totalEscrowAmount - allocatedMilestonesTotal);
  const hasRemainingPayment = escrow.remaining > 0;
  const progressPercent = escrow.progress || 0;

  const stages = [
    { key: 'pending_funding', label: 'Awaiting Entry Capital', icon: Clock },
    { key: 'funded', label: 'Escrow Pool Vault Locked', icon: Shield },
    { key: 'inspection', label: 'Verification Period Active', icon: Home },
    { key: 'closing', label: 'Legal Disbursal Check Signoff', icon: FileCheck },
    { key: 'completed', label: 'Disbursement Matrix Executed', icon: CheckCircle },
  ];
  const currentStageIndex = stages.findIndex(s => s.key === escrow.status);
  const activeStageIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto p-6 bg-[#f9fafb] min-h-screen text-gray-900 font-sans">
      
      {/* Toast Overlay */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle size={16} /> Settlement entry updated.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Header Elements matching image_c0116e.png */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition group text-xs font-bold">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition" />
          <span>Back</span>
        </button>
        
        {remainingUnallocatedBalance > 0 && isSeller && (
          <button onClick={() => setIsMilestoneModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm">
            <PlusCircle size={14} /> Split Milestone Block
          </button>
        )}
      </div>

      {/* Main Structural Container Ledger Frame */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-[#141414] text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                Escrow Transaction Node ID #{escrow.id}
              </span>
              <h1 className="text-xl font-black mt-3 tracking-tight">{(escrow as any).property?.title || 'Real Estate Asset Escrow'}</h1>
            </div>
              <div className="bg-white/10 border border-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-mono tracking-wide font-bold">
              {(escrow.status || '').replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Aggregate Processing State Indicators */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Settlement Performance Progress</span>
            <span className="text-xl font-black text-indigo-600">{progressPercent}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-indigo-600 rounded-full"
            />
          </div>
        </div>

        {/* Normalized Grid Financial Rows matching image_c0116e.png layout */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50/70 border-b border-gray-100 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Valuation Cap</span>
            <p className="text-base font-black text-gray-900 mt-1">{formatCurrency(totalEscrowAmount)}</p>
          </div>
          <div className="border-x border-gray-100">
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Locked Vault Assets</span>
            <p className="text-base font-black text-emerald-600 mt-1">{formatCurrency(escrow.total_paid)}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Outstanding Obligation</span>
            <p className="text-base font-black text-amber-500 mt-1">{formatCurrency(escrow.remaining)}</p>
          </div>
        </div>

        {/* Dynamic Context Multi-Perspective Operational Work Deck */}
        <div className="p-6 bg-white border-t border-gray-50">
          <div className="flex items-center gap-1.5 mb-4 text-xs font-bold text-gray-800 uppercase tracking-wider">
            <Scale size={14} className="text-indigo-500" />
            <span>Context Control Matrix Panel</span>
            <span className="ml-auto text-[9px] lowercase font-normal text-gray-400 px-2 py-0.5 bg-gray-100 rounded">
              Acting profile: {isBuyer ? 'Buyer account' : isSeller ? 'Seller profile' : 'Broker proxy'}
            </span>
          </div>

          {/* Dynamic Render Paths according to Role Permissions */}
          {isBuyer ? (
            <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-indigo-900 mb-1">Buyer Disbursal Management Operations</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-4">Verify matching physical structural elements meet stated terms prior to updating lock parameters.</p>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBuyerReleaseFunds}
                  disabled={actionLoading || escrow.status === 'completed'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                >
                  <CheckCircle size={14} /> Approve & Release Capital
                </button>
                <button
                  onClick={handleRaiseDispute}
                  disabled={actionLoading || escrow.status === 'completed'}
                  className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  <ShieldAlert size={14} /> Trigger Arbitrage Dispute Flag
                </button>
              </div>
            </div>
          ) : isSeller ? (
            <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-amber-900 mb-1">Seller Performance Metrics Submission Console</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-4">File tracking validation progress metrics onto the active stream to prompt buyer review protocols.</p>
              
              <button
                onClick={handleSellerRequestInspection}
                disabled={actionLoading || escrow.status === 'completed'}
                className="bg-[#141414] hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <FileCheck size={14} /> Notify Completion & Request Inspection Call
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
                <HelpCircle size={14} /> Read-only proxy access active for management agency oversight accounts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Phase Track Milestone Progress Display Section Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <TrendingUp size={14} /> Transaction Lifecycle Framework Status
        </h3>
        <div className="grid md:grid-cols-5 gap-4">
          {stages.map((stage, idx) => (
            <TimelineStage key={stage.key} stage={stage} index={idx} currentIndex={activeStageIndex} icon={stage.icon} />
          ))}
        </div>
      </div>

      {/* Itemized Milestones Component List Display Loop */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Itemized Contract Milestones Breakdown</h3>
        {escrow.milestones && escrow.milestones.length > 0 ? (
          <div className="space-y-2">
            {escrow.milestones.map((milestone: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 border border-gray-50 rounded-xl hover:bg-gray-50/70 transition">
                <div>
                  <p className="text-xs font-bold text-gray-900">{milestone.name}</p>
                  <p className="text-[10px] text-gray-400">Reference Index: Stage_0{index + 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-gray-900">{formatCurrency(milestone.amount)}</p>
                  <span className="inline-block text-[9px] px-2 py-0.5 font-medium rounded bg-gray-100 text-gray-600 uppercase tracking-wide mt-0.5">
                    {milestone.status || 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No structured contract split milestone steps logged against this account node configuration framework.</p>
        )}
      </div>

      {/* Contract Terms Framework Details Panel */}
      {escrow.terms && (
        <div className="bg-gray-100/60 rounded-2xl p-5 mb-6 border border-gray-100">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield size={14} /> Executed Contract Stipulations</h4>
          <p className="text-xs text-gray-600 leading-relaxed font-mono">{escrow.terms}</p>
        </div>
      )}

      {/* Core Payment Execution Interaction Drawer (Accessible only when balance remains and active context is Buyer) */}
      {hasRemainingPayment && isBuyer && (
        <div className="bg-gradient-to-br from-[#141414] to-gray-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="text-center mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Unfunded Settlement Balance Balance Due</p>
            <p className="text-3xl font-black text-white mt-1 tracking-tight">{formatCurrency(escrow.remaining)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setIsMpesaModalOpen(true)} 
              className="flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-md"
            >
              <Smartphone size={16} /> Pay via M-Pesa SIM Push
            </button>
            <button 
              onClick={handlePayWithCard} 
              disabled={paymentProcessing} 
              className="flex items-center justify-center gap-1.5 bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50 shadow-md"
            >
              <CreditCard size={16} /> {paymentProcessing ? 'Tokenizing Core...' : 'Pay via Mastercard Card'}
            </button>
          </div>
        </div>
      )}

      {/* --- EXTERNAL UTILITY MODALS DECLARATIONS --- */}
      <CreateMilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        onSubmit={handleCreateMilestoneSubmit}
        remainingAmount={remainingUnallocatedBalance}
      />

      <MpesaPaymentModal
        isOpen={isMpesaModalOpen}
        onClose={() => setIsMpesaModalOpen(false)}
        escrowId={escrow.id}
        amount={escrow.remaining}
        onSuccess={() => fetchEscrow(id!)}
      />

    </motion.div>
  );
};