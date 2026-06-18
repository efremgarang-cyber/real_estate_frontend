// 📁 File: src/hooks/useEscrow.ts
import { useState, useEffect, useCallback } from 'react';
import { escrowApi } from '../api/escrow';

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
  };
};