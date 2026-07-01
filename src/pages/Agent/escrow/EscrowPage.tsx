import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useEscrow } from '../../../hooks/useEscrow';
import { escrowApi } from '../../../api/escrow';
import { EscrowProgressTracker } from '../../../components/Escrow/EscrowProgressTracker';
import { DepositModal } from '../../../components/DepositModal';
import { motion } from 'framer-motion';
import {
  Shield,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────
// Temporary local type definition (since you don't have src/types/index.ts)
// ────────────────────────────────────────────────────────────────
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

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-amber-50 text-amber-700 border border-amber-200',
  held: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  inspection: 'bg-blue-50 text-blue-700 border border-blue-200',
  released: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  refunded: 'bg-gray-50 text-gray-500 border border-gray-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export const EscrowPage: React.FC = () => {
  const {
    transactions = [],
    loading,
    refreshTransactions,
  } = useEscrow() as {
    transactions: Tx[];
    loading: boolean;
    refreshTransactions?: () => void;
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isAutoPopulated, setIsAutoPopulated] = useState(false);
  const verificationStarted = useRef(false);

  // Form state
  const [form, setForm] = useState({
    leadId: '',
    clientName: '',
    clientEmail: '',
    providerName: '',
    providerEmail: '',
    providerPhone: '',
    propertyTitle: '',
    amount: '',
  });
  const [submitting, setSubmitting] = useState(false);

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

  // ─── Pipeline interceptor ─────────────────────────────────────
  useEffect(() => {
    const context = location.state?.leadContext;
    if (context) {
      setForm({
        leadId: context.leadId || '',
        clientName: context.clientName || '',
        clientEmail: context.clientEmail || '',
        providerName: context.providerName || '',
        providerEmail: context.providerEmail || '',
        providerPhone: context.providerPhone || '',
        propertyTitle: context.description || '',
        amount: context.amount ? String(context.amount) : '',
      });
      setIsAutoPopulated(true);
      triggerToast('Pipeline sync: Customer deal metrics mapped successfully!', 'success');
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // ─── Payment verification ─────────────────────────────────────
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (reference && !verificationStarted.current) {
      verificationStarted.current = true;

      const handlePaymentReturn = async () => {
        triggerToast('Payment processed. Updating escrow list...', 'info');

        // Clear URL parameters
        setSearchParams({}, { replace: true });

        // Refresh immediately
        await refreshTransactions?.();

        // ✅ Refresh again after 5 seconds (callback is async)
        setTimeout(async () => {
          await refreshTransactions?.();
          triggerToast('Escrow list updated. Check Total Held.', 'success');
          if (transactions?.length > 0) {
            setSelectedTx(transactions[0]);
          }
        }, 5000);
      };

      handlePaymentReturn();
    }
  }, [searchParams, setSearchParams, refreshTransactions, triggerToast]);

  // ─── Compute total held ──────────────────────────────────────
  const totalHeld = useMemo(
    () =>
      transactions
        .filter((t) => ['held', 'inspection', 'active'].includes(t.status))
        .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0),
    [transactions]
  );

  const activeTx = selectedTx || transactions[0] || null;
  const isValidEscrowId = activeTx?.id && String(activeTx.id) !== 'undefined';

  // ─── Create new escrow ────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { clientEmail, providerEmail, providerPhone, amount, leadId } = form;
    if (!clientEmail || !providerEmail || !providerPhone || !amount) {
      triggerToast('Please fill in all required fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const data = await escrowApi.initialize({
        clientEmail,
        providerEmail,
        providerPhone,
        amount: parseFloat(amount),
        description: form.propertyTitle || 'Property escrow',
        escrowId: undefined, // new escrow, no existing ID
        leadId, // will be stored in metadata
      });

      const directUrl = data.paymentUrl || data.paymentLink || data.data?.authorization_url;
      if (directUrl) {
        triggerToast('Redirecting to secure gateway checkout...', 'success');
        window.location.href = directUrl;
      } else {
        triggerToast('Escrow created locally. Awaiting payment authorization.', 'success');
        refreshTransactions?.();
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to create escrow', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Handle deposit ──────────────────────────────────────────
const handleDepositInitialization = async (amount: number, escrowId?: number): Promise<string | null> => {
  try {
    const sessionUserString = localStorage.getItem('user');
    const sessionUser = sessionUserString ? JSON.parse(sessionUserString) : null;
    const targetEmail = form.clientEmail || sessionUser?.email || 'agent@makao.com';

    // Use the same initialize method as "Pay Remaining"
    const data = await escrowApi.initialize({
      clientEmail: targetEmail,
      providerEmail: form.providerEmail || targetEmail,
      providerPhone: form.providerPhone || '254700000000',
      amount: amount,
      description: `Deposit to escrow ${escrowId || ''}`,
      escrowId: escrowId, // link to existing escrow
    });

    if (data.paymentUrl) {
      return data.paymentUrl;
    }
    throw new Error(data.message || 'Deposit initialization failed.');
  } catch (error: any) {
    triggerToast(error.message || 'Failed to initialize deposit.', 'error');
    throw error;
  }
};

  // ─── Handle "Pay Remaining" from EscrowProgressTracker ──────
  const handlePaymentClick = async (escrowData: EscrowWithProgress) => {
    const { escrow, remaining } = escrowData;
    if (remaining <= 0) {
      triggerToast('No remaining amount to pay.', 'info');
      return;
    }

    try {
      const data = await escrowApi.initialize({
        clientEmail: escrow.client_email,
        providerEmail: escrow.provider_email,
        providerPhone: escrow.provider_phone,
        amount: remaining,
        description: `Additional payment for escrow ${escrow.id}`,
        escrowId: escrow.id, // pass the escrow ID
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

  // ─── Format status for display ──────────────────────────────
  const formatStatus = (s: string) => s.replace(/_/g, ' ');

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen text-gray-800">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white shadow-xl border border-gray-200 px-4 py-3 rounded-xl max-w-md">
          {toast.type === 'success' && <CheckCircle className="text-emerald-500" size={18} />}
          {toast.type === 'error' && <AlertCircle className="text-red-500" size={18} />}
          <p className="text-sm font-medium">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">
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
          <p className="text-sm text-gray-500">Secure payments via M‑Pesa & cards</p>
        </div>
        <button
          onClick={() => {
            refreshTransactions?.();
            triggerToast('Refreshed tracking layers.', 'info');
          }}
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
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-sm">
              ⚡
            </div>
            <div>
              <p className="text-sm font-bold">Unified pipeline context active</p>
              <p className="text-xs text-indigo-600 font-medium">
                Verified parameters linked directly from sales lead records.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAutoPopulated(false)}
            className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100/50 rounded-xl text-xs font-semibold transition"
          >
            Modify Manually
          </button>
        </motion.div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          {/* Balance */}
          <div>
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Wallet size={14} /> Total Held
              </span>
              <button type="button" onClick={() => setShowInfo(!showInfo)} className="hover:text-gray-600">
                <span className="text-base">ⓘ</span>
              </button>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold">Ksh {totalHeld.toLocaleString()}</span>
              <p className="text-xs text-gray-400 mt-1">Secured via Paystack</p>
            </div>
            {showInfo && (
              <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">
                Funds are held securely in escrow channels.
              </p>
            )}
          </div>

          {/* Progress Tracker */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Selected Escrow Progress
            </h4>
            {isValidEscrowId ? (
              <EscrowProgressTracker
                escrowId={activeTx!.id}
                onPaymentClick={handlePaymentClick} // ✅ passed handler
              />
            ) : (
              <p className="text-sm text-gray-400">Select an escrow from the table below to see its progress.</p>
            )}
          </div>

          {/* Release/Action panel (optional – you can keep or remove) */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {activeTx ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDepositModalOpen(true)}
                  className="flex-1 bg-gray-900 text-white font-semibold py-2 rounded-xl hover:bg-black transition flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft size={18} /> Fund Escrow
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Select an escrow agreement to manage deposits and withdrawals.
              </p>
            )}
          </div>
        </div>

        {/* Right card: Create Escrow */}
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <PlusCircle size={18} /> New Escrow Agreement
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <input type="hidden" value={form.leadId} />
            <div>
              <label className="block text-xs font-medium text-gray-500">Client Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Munene"
                className={`w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none transition ${
                  isAutoPopulated ? 'bg-gray-50 opacity-80 cursor-not-allowed border-dashed' : ''
                }`}
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                readOnly={isAutoPopulated}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Client Email *</label>
              <input
                type="email"
                placeholder="client@example.com"
                className={`w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none transition ${
                  isAutoPopulated ? 'bg-gray-50 opacity-80 cursor-not-allowed border-dashed' : ''
                }`}
                value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                required
                readOnly={isAutoPopulated}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Provider Name</label>
              <input
                type="text"
                placeholder="e.g. Sarah Cherotich"
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                value={form.providerName}
                onChange={(e) => setForm({ ...form, providerName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Provider Email *</label>
              <input
                type="email"
                placeholder="provider@example.com"
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                value={form.providerEmail}
                onChange={(e) => setForm({ ...form, providerEmail: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Provider Phone (M‑Pesa) *</label>
              <input
                type="tel"
                placeholder="2547xxxxxxxx"
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                value={form.providerPhone}
                onChange={(e) => setForm({ ...form, providerPhone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Amount (KES) *</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                className={`w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none transition ${
                  isAutoPopulated ? 'bg-gray-50 font-bold opacity-80 cursor-not-allowed border-dashed' : ''
                }`}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                readOnly={isAutoPopulated}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Property Title</label>
              <input
                type="text"
                placeholder="Greenwood Heights - Apt 4B"
                className={`w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none transition ${
                  isAutoPopulated ? 'bg-gray-50 opacity-80 cursor-not-allowed border-dashed' : ''
                }`}
                value={form.propertyTitle}
                onChange={(e) => setForm({ ...form, propertyTitle: e.target.value })}
                readOnly={isAutoPopulated}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-black transition disabled:opacity-50"
            >
              {submitting ? 'Creating Secure Intent...' : 'Create & Pay'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Escrows Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-600">Active Escrows</h3>
          <span className="text-xs text-gray-400">{transactions?.length || 0} total</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading secure logs...</div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No escrow agreements found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Provider</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
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
                    <td className="px-4 py-3 text-gray-700">{tx.clientName || tx.client_email?.split('@')[0] || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{tx.providerName || tx.provider_email?.split('@')[0] || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">Ksh {parseFloat(String(tx.amount)).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_STYLES[tx.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {formatStatus(tx.status)}
                      </span>
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
        escrowId={activeTx?.id}
      />
    </div>
  );
};

export default EscrowPage;