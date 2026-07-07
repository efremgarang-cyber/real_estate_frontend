import React, { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton'; 
import {
  adminTransactionsApi,
  Transaction,
  TransactionFilters,
} from '../../api/adminTransactions';

function formatKes(amount: string | number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

const statusStyles: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-5 py-4">
      <Skeleton className="h-4 w-28 mb-1.5" />
      <Skeleton className="h-3 w-36" />
    </td>
    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
    <td className="px-5 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
    <td className="px-5 py-4"><Skeleton className="h-3 w-24" /></td>
    <td className="px-5 py-4"><Skeleton className="h-3 w-20" /></td>
    <td className="px-5 py-4 text-right"><Skeleton className="h-7 w-7 rounded-lg inline-block" /></td>
  </tr>
);

export const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false); // Track PDF download execution state
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1 });
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminTransactionsApi.list(filters);
      setTransactions(res.data);
      setTotalPages(res.last_page);
    } catch (err) {
      setError('Could not load transactions. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResolve = async (id: number, status: 'completed' | 'failed') => {
    if (!confirm(`Mark this payment as ${status}? This will trigger activation logic if completed.`)) {
      return;
    }
    setUpdatingId(id);
    try {
      await adminTransactionsApi.updateStatus(id, status);
      await fetchTransactions();
    } catch (err) {
      alert('Failed to update payment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Process the binary PDF data stream seamlessly using the authenticated interceptor instance
  // Process the binary PDF data stream seamlessly using the authenticated interceptor instance
// Process the binary PDF data stream seamlessly using the authenticated interceptor instance
  const handleExport = async () => {
    setExporting(true);
    try {
      // 1. Cast the response to 'any' to bypass rigid type checks on the raw stream structure
      const response = await adminTransactionsApi.export(filters) as any;
      
      // 2. Safely extract the payload whether it's an Axios wrapper or a direct Blob object
      const blob = response instanceof Blob 
        ? response 
        : (response?.data instanceof Blob ? response.data : new Blob([response?.data ?? response], { type: 'application/pdf' }));
      
      // 3. Convert into a clean client-side virtual reference link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Format download title explicitly with the current generation timestamp
      const fileTimestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `MAKAO-Financial-Statement-${fileTimestamp}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      
      // Unmount structural remnants from memory cleanly
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Streaming Extraction Error:", err);
      alert('Failed to export statement. Please verify your administrative access.');
    } finally {
      setExporting(false);
    }
  };

  
  return (
    <div className="w-full font-sans text-[#141414] dark:text-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <select title="filters"
            value={filters.status ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
            className="px-4 py-2 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-gray-700 rounded-xl text-sm"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select title="paymentmethod"
            value={filters.payment_method ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, payment_method: e.target.value || undefined, page: 1 }))}
            className="px-4 py-2 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-gray-700 rounded-xl text-sm"
          >
            <option value="">All methods</option>
            <option value="mpesa">M-Pesa</option>
            <option value="paystack_card">Paystack Card</option>
          </select>

          <select title="paymentype"
            value={filters.payment_type ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, payment_type: e.target.value || undefined, page: 1 }))}
            className="px-4 py-2 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-gray-700 rounded-xl text-sm"
          >
            <option value="">All types</option>
            <option value="escrow">Escrow</option>
            <option value="subscription">Subscription</option>
          </select>

          <button
            onClick={fetchTransactions}
            className="p-2 border border-neutral-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-medium disabled:opacity-70 transition-opacity"
        >
          {exporting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download size={16} />
              Export Statement
            </>
          )}
        </button>
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-3xl border border-neutral-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-gray-700 text-left text-xs uppercase text-gray-400">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, idx) => <TableRowSkeleton key={idx} />)
              ) : error ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-sm text-rose-500">{error}</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-sm text-gray-400">No transactions match these filters.</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium">{tx.user?.name ?? 'N/A'}</p>
                      <p className="text-xs text-gray-400">{tx.user?.email ?? ''}</p>
                    </td>
                    <td className="px-5 py-4 font-medium">{formatKes(tx.amount)}</td>
                    <td className="px-5 py-4 capitalize">{tx.payment_type ?? '—'}</td>
                    <td className="px-5 py-4 capitalize">{tx.payment_method}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[tx.status] ?? ''}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">{tx.transaction_reference ?? '—'}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString('en-KE')}
                    </td>
                    <td className="px-5 py-4">
                      {tx.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={updatingId === tx.id}
                            onClick={() => handleResolve(tx.id, 'completed')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                            title="Mark completed"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button
                            disabled={updatingId === tx.id}
                            onClick={() => handleResolve(tx.id, 'failed')}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-50"
                            title="Mark failed"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-neutral-100 dark:border-gray-800">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setFilters((f) => ({ ...f, page: p }))}
                className={`w-8 h-8 rounded-lg text-xs font-medium ${
                  (filters.page ?? 1) === p ? 'bg-black text-white' : 'hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};