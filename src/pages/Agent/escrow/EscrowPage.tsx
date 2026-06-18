// 📁 File: src/pages/Agent/escrow/EscrowPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useEscrow } from '../../../hooks/useEscrow';
import { escrowApi } from '../../../api/escrow'; 
import { EscrowProgressTracker } from '../../../components/Escrow/EscrowProgressTracker';
import { DepositModal } from '../../../components/DepositModal'; 
import {
  Shield,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Home,
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

  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Modal toggle state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    providerName: '',
    providerEmail: '',
    providerPhone: '',
    propertyTitle: '',
    amount: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check URL callback from Paystack
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    const escrowId = params.get('escrowId');
    if (reference && escrowId) {
      triggerToast(`Payment successful! Escrow #${escrowId} is now held.`, 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
      refreshTransactions?.();
    }
  }, [refreshTransactions]);

  const totalHeld = useMemo(
    () =>
      transactions
        .filter((t) => ['held', 'inspection'].includes(t.status))
        .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0),
    [transactions]
  );

  const activeTx = selectedTx || transactions[0] || null;
  const isValidEscrowId = activeTx?.id && String(activeTx.id) !== 'undefined';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { clientEmail, providerEmail, providerPhone, amount } = form;
    
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

  // 🌟 FIXED & OPTIMIZED: Robust validation handling and authentic fallback extraction
  const handleDepositInitialization = async (amount: number): Promise<string | null> => {
    try {
      // Pull user profile details out of localStorage if available
      const sessionUserString = localStorage.getItem('user');
      const sessionUser = sessionUserString ? JSON.parse(sessionUserString) : null;

      // Prioritize form input -> profile storage -> structural placeholder fallback
      const targetEmail = form.clientEmail || sessionUser?.email || "agent@makao.com";

      const result = await escrowApi.initializeDeposit({ 
        amount, 
        email: targetEmail 
      });

      if (result && (result.paymentUrl || result.data?.authorization_url)) {
        return result.paymentUrl || result.data?.authorization_url;
      }
      
      throw new Error(result.error || result.message || 'Invalid initialization response layout from server API.');
    } catch (error: any) {
      console.error("Critical error inside frontend deposit proxy pipeline:", error);
      triggerToast(error.message || 'Connection breakdown handling Paystack execution maps.', 'error');
      throw error; // Re-throw to allow DepositModal's component catching states to resolve correctly
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
          onClick={() => { refreshTransactions?.(); triggerToast('Refreshed', 'info'); }}
          className="text-gray-400 hover:text-gray-600"
          type="button"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Balance + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Balance card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1"><Wallet size={14} /> Total Held</span>
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
          
          <div className="flex gap-3 mt-4">
            <button 
              type="button" 
              onClick={() => setIsDepositModalOpen(true)}
              className="flex-1 bg-gray-900 text-white text-sm font-medium py-2 rounded-xl hover:bg-black transition"
            >
              <ArrowDownLeft size={16} className="inline mr-1" /> Deposit
            </button>
            
            <button type="button" className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2 rounded-xl hover:bg-gray-50 transition">
              <ArrowUpRight size={16} className="inline mr-1" /> Withdraw
            </button>
          </div>
        </div>

        {/* Create escrow form */}
        <form onSubmit={handleCreate} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <PlusCircle size={18} /> New Escrow Agreement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500">Client Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Munene"
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Client Email *</label>
              <input
                type="email"
                placeholder="client@example.com"
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                required
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
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500">Property Title</label>
              <input
                type="text"
                placeholder="Greenwood Heights - Apt 4B"
                className="w-full mt-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                value={form.propertyTitle}
                onChange={(e) => setForm({ ...form, propertyTitle: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-black transition disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create & Pay'}
          </button>
        </form>
      </div>

      {/* Escrow list and detail side‑by‑side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-600">Active Escrows</h3>
            <span className="text-xs text-gray-400">{transactions?.length || 0} total</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No escrow agreements found.</div>
          ) : (
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
                    className={`cursor-pointer hover:bg-gray-50 transition ${
                      activeTx?.id === tx.id ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-gray-600">#{tx.id}</td>
                    <td className="px-4 py-3">{tx.clientName || tx.client_email?.split('@')[0] || '—'}</td>
                    <td className="px-4 py-3">{tx.providerName || tx.provider_email?.split('@')[0] || '—'}</td>
                    <td className="px-4 py-3 font-medium">Ksh {parseFloat(String(tx.amount)).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                        {formatStatus(tx.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right panel: Progress tracker */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">State Vector</h3>
          {isValidEscrowId ? (
            <EscrowProgressTracker
              escrowId={activeTx!.id}
              onPaymentClick={() => {
                if (activeTx?.status === 'pending_payment') {
                  triggerToast('Redirecting to Paystack to complete payment.', 'info');
                }
              }}
            />
          ) : (
            <p className="text-sm text-gray-400">Select an agreement to see details.</p>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal 
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onInitializeDeposit={handleDepositInitialization}
      />
    </div>
  );
};

export default EscrowPage;