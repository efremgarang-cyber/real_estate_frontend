import { useState, useEffect, useCallback } from 'react';
import { escrowApi } from '../api/escrow';
import { api } from '../lib/api';

/**
 * Lightweight EscrowJob type used by EscrowConsole and other UI components.
 * Keeps shape minimal to satisfy callers; expand as needed.
 */
export type EscrowJob = {
  id: number | string;
  status: string;
  amount: number | string;
  handover_documents_url?: string;
  [key: string]: any;
};

export const useEscrow = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await escrowApi.getAll();
      // Support both array and wrapped responses
      setTransactions(Array.isArray(data) ? data : data.transactions || []);
    } catch (err: any) {
      console.error('Error fetching escrow ledger:', err);
      setError(err.response?.data?.message || 'Failed to fetch trust accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Release funds (after deliverable is approved)
  const releaseEscrow = async (escrowId: string | number) => {
    try {
      const response = await escrowApi.release(escrowId);
      await fetchTransactions(); // refresh list
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Release failed:', err);
      return { success: false, error: err.response?.data?.error || 'Release failed' };
    }
  };

  // Refund (optional)
  const refundEscrow = async (escrowId: string | number) => {
    try {
      const response = await escrowApi.refund(escrowId);
      await fetchTransactions();
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Refund failed:', err);
      return { success: false, error: err.response?.data?.error || 'Refund failed' };
    }
  };

  // Submit handover proof (used by EscrowConsole). Best-effort POST to backend,
  // falls back to returning null on failure.
  const submitHandover = async (escrowId: string | number, userId: string | number, documentUrl: string) => {
    try {
      const res = await api.post(`/escrow/${escrowId}/handover`, { user_id: userId, document_url: documentUrl });
      await fetchTransactions();
      return res.data as EscrowJob;
    } catch (err) {
      console.warn('submitHandover failed (endpoint may not exist):', err);
      return null;
    }
  };

  // Verify escrow (inspector actions) — action examples: 'RELEASE_TO_LANDLORD', 'REFUND_TO_TENANT'
  const verifyEscrow = async (escrowId: string | number, action: string, notes?: string) => {
    try {
      const res = await api.post(`/escrow/${escrowId}/verify`, { action, notes });
      await fetchTransactions();
      return res.data as EscrowJob;
    } catch (err) {
      console.warn('verifyEscrow failed (endpoint may not exist):', err);
      return null;
    }
  };

  // Legacy alias for compatibility with EscrowPage
  const disburseEscrowPool = releaseEscrow;

  return {
    transactions,
    loading,
    error,
    refreshTransactions: fetchTransactions,
    releaseEscrow,
    refundEscrow,
    disburseEscrowPool, // keep for backward compatibility
    // New exports expected by EscrowConsole
    submitHandover,
    verifyEscrow,
  };
};
