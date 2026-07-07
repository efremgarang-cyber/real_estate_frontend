import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useEscrow } from '../../../hooks/useEscrow';
import { escrowApi } from '../../../api/escrow';
import { api } from '../../../lib/api';
import { EscrowProgressTracker } from '../../../components/Escrow/EscrowProgressTracker';
import { DepositModal } from '../../../components/DepositModal';
import { motion } from 'framer-motion';
import {
  Shield,
  PlusCircle,
  ArrowDownLeft,
  Wallet,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

type Tx = {
  id: string | number;
  clientName?: string;
  client_email?: string;
  providerName?: string;
  provider_email?: string;
  provider_phone?: string;
  propertyTitle?: string;
  amount?: number | string;
  status: string;
  updated_at?: string;
  payment_reference?: string;
};

type EscrowWithProgress = {
  escrow: {
    id: number;
    client_email: string;
    provider_email: string;
    provider_phone: string;
    amount: number;
    status: string;
  };
  remaining: number;
};

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-amber-50 text-amber-700 border border-amber-200',
  pending_funding: 'bg-amber-50 text-amber-700 border border-amber-200',
  held: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  inspection: 'bg-blue-50 text-blue-700 border border-blue-200',
  released: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  refunded: 'bg-gray-50 text-gray-500 border border-gray-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export const EscrowPage: React.FC = () => {
  const { transactions = [], loading, refreshTransactions } = useEscrow();

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isAutoPopulated, setIsAutoPopulated] = useState(false);
  const verificationStarted = useRef(false);

  // Properties for dropdown
  const [properties, setProperties] = useState<any[]>([]);

  // Form state
  const [form, setForm] = useState({
    propertyId: '',
    amount: '',
    terms: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch properties for dropdown ───────────────────────────
  useEffect(() => {
    api.get('/agent/properties').then((res) => {
      setProperties(res.data.data || res.data || []);
    }).catch(() => setProperties([]));
  }, []);

  // ─── Toast helper ─────────────────────────────────────────────
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ─── Pipeline interceptor (from Kanban lead) ─────────────────
  useEffect(() => {
    const context = location.state?.leadContext;
    if (context) {
      setForm({
        propertyId: context.propertyId ? String(context.propertyId) : '',
        amount: context.amount ? String(context.amount) : '',
        terms: context.description || '',
      });
      setIsAutoPopulated(true);
      triggerToast('Pipeline sync: Lead data mapped successfully!', 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

// ─── Payment verification on return from Paystack ────────────
useEffect(() => {
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  if (reference && !verificationStarted.current) {
    verificationStarted.current = true;

    const handlePaymentReturn = async () => {
      triggerToast('Verifying payment...', 'info');
      setSearchParams({}, { replace: true });

      try {
        // Verify payment and update escrow balance in Laravel
        await api.get(`/escrows/verify/${reference}`);
        triggerToast('Payment verified! Escrow balance updated.', 'success');
      } catch (err) {
        // Still refresh even if verify fails — payment may have gone through
        triggerToast('Payment received. Refreshing escrow data...', 'info');
      }

      // Refresh escrow list
      await refreshTransactions?.();

      // Second refresh after 3 seconds to catch any delayed updates
      setTimeout(async () => {
        await refreshTransactions?.();
        if (transactions?.length > 0) setSelectedTx(transactions[0]);
      }, 3000);
    };

    handlePaymentReturn();
  }
}, [searchParams, setSearchParams, refreshTransactions, transactions]);

  // ─── Compute total held ──────────────────────────────────────
const totalHeld = useMemo(
    () =>
      transactions
        .filter((t) => ['held', 'inspection', 'active', 'pending_funding'].includes(t.status))
        .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0),
    [transactions]
);

  const activeTx = selectedTx || transactions[0] || null;
  const safeActiveTxId = activeTx?.id ? parseInt(String(activeTx.id), 10) : undefined;
  const isValidEscrowId = safeActiveTxId !== undefined && !isNaN(safeActiveTxId);

  // ─── Create new escrow ────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyId || !form.amount) {
      triggerToast('Please select a property and enter an amount.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await escrowApi.initialize({
        property_id: parseInt(form.propertyId),
        amount: parseFloat(form.amount),
        terms: form.terms || undefined,
      });
      triggerToast('Escrow created successfully!', 'success');
      refreshTransactions?.();
      setForm({ propertyId: '', amount: '', terms: '' });
      setIsAutoPopulated(false);
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to create escrow', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Handle deposit ───────────────────────────────────────────
 const handleDepositInitialization = async (amount: number, escrowId?: number): Promise<string | null> => {
    try {
        const data = await escrowApi.initializeDeposit({ amount, escrowId });
        if (data.paymentUrl) return data.paymentUrl; // ← return URL, let DepositModal open it
        throw new Error(data.message || 'Deposit initialization failed.');
    } catch (error: any) {
        triggerToast(error.message || 'Failed to initialize deposit.', 'error');
        throw error;
    }
};

  // ─── Handle Pay Remaining from EscrowProgressTracker ─────────
  const handlePaymentClick = async (escrowData: EscrowWithProgress) => {
    const { escrow, remaining } = escrowData;
    if (remaining <= 0) {
      triggerToast('No remaining amount to pay.', 'info');
      return;
    }
    try {
      const data = await escrowApi.initializeDeposit({
        amount: remaining,
        escrowId: escrow.id,
      });
      if (data.paymentUrl) {
        triggerToast('Redirecting to secure gateway...', 'success');
        window.location.href = data.paymentUrl;
      } else {
        triggerToast('Payment initialization failed, no URL returned.', 'error');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to initialize payment.', 'error');
    }
  };

  const formatStatus = (s: string) => s.replace(/_/g, ' ');

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen text-gray-800">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white shadow-xl border border-gray-200 px-4 py-3 rounded-xl max-w-md">
          {toast.type === 'success' && <CheckCircle className="text-emerald-500" size={18} />}
          {toast.type === 'error' && <AlertCircle className="text-red-500" size={18} />}
          {toast.type === 'info' && <AlertCircle className="text-blue-400" size={18} />}
          <p className="text-sm font-medium">{toast.message}</p>
          <button title="close" onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={24} /> Escrow Vault
          </h1>
          <p className="text-sm text-gray-500">Secure property payments</p>
        </div>
        <button
          title="refresh"
          onClick={() => { refreshTransactions?.(); triggerToast('Refreshed.', 'info'); }}
          className="text-gray-400 hover:text-gray-600 transition duration-150 transform active:rotate-180"
          type="button"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Pipeline sync banner */}
      {isAutoPopulated && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-2xl flex items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-sm">⚡</div>
            <div>
              <p className="text-sm font-bold">Pipeline context active</p>
              <p className="text-xs text-indigo-600 font-medium">Lead data mapped from sales pipeline.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setIsAutoPopulated(false); setForm({ propertyId: '', amount: '', terms: '' }); }}
            className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100/50 rounded-xl text-xs font-semibold transition"
          >
            Clear & Edit
          </button>
        </motion.div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Left: metrics + progress */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div>
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1"><Wallet size={14} /> Total Held</span>
              <button type="button" onClick={() => setShowInfo(!showInfo)} className="hover:text-gray-600">
                <span className="text-base">ⓘ</span>
              </button>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold">Ksh {totalHeld.toLocaleString()}</span>
              <p className="text-xs text-gray-400 mt-1">Secured in escrow</p>
            </div>
            {showInfo && (
              <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">
                Funds are held securely until escrow conditions are met.
              </p>
            )}
          </div>

          {/* Progress Tracker */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Selected Escrow Progress</h4>
            {isValidEscrowId ? (
              <EscrowProgressTracker escrowId={safeActiveTxId!} onPaymentClick={handlePaymentClick} />
            ) : (
              <p className="text-sm text-gray-400">Select an escrow below to see its progress.</p>
            )}
          </div>

          {/* Action panel */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {activeTx && parseFloat(String(activeTx.remaining ?? activeTx.amount ?? 0)) > 0 ? (
  <button
    onClick={() => setIsDepositModalOpen(true)}
    className="w-full bg-gray-900 text-white font-semibold py-2 rounded-xl hover:bg-black transition flex items-center justify-center gap-2"
  >
    <ArrowDownLeft size={18} /> Fund Escrow
  </button>
) : activeTx ? (
  <div className="w-full text-center py-2 text-emerald-600 font-semibold text-sm flex items-center justify-center gap-2">
    <CheckCircle size={18} /> Fully Funded
  </div>
) : (
              <p className="text-sm text-gray-400">Select an escrow agreement to manage deposits.</p>
            )}
          </div>
        </div>

        {/* Right: creation form */}
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <PlusCircle size={18} /> New Escrow Agreement
          </h2>
          <div className="grid grid-cols-1 gap-4">

            {/* Property selector */}
            <div>
              <label className="block text-xs font-medium text-gray-500">Property *</label>
              <select title="property"
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none bg-white"
                value={form.propertyId}
                onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                required
              >
                <option value="">Select a property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-500">Amount (KES) *</label>
              <input
                type="number"
                placeholder="e.g. 150000"
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            {/* Terms */}
            <div>
              <label className="block text-xs font-medium text-gray-500">Terms</label>
              <textarea
                placeholder="e.g. Funds released after title deed transfer"
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none resize-none"
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-black transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Escrow'}
            </button>
          </div>
        </form>
      </div>

      {/* Escrow table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-600">Active Escrows</h3>
          <span className="text-xs text-gray-400">{transactions?.length || 0} total</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading escrow records...</div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No escrow agreements found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Property</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={`cursor-pointer hover:bg-gray-50 transition border-b border-b-gray-50 last:border-0 ${
                      activeTx?.id === tx.id ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">#{tx.id}</td>
                    <td className="px-4 py-3 text-gray-700">{tx.propertyTitle || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      Ksh {parseFloat(String(tx.amount || 0)).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                        {formatStatus(tx.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {tx.updated_at ? new Date(tx.updated_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onInitializeDeposit={handleDepositInitialization}
        escrowId={safeActiveTxId}
      />
    </div>
  );
};

export default EscrowPage;