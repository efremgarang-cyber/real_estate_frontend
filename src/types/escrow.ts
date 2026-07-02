import { useState, useEffect } from "react";

export interface EscrowTransaction {
  id: string;
  leadId: string;
  clientName: string;
  propertyTitle: string;
  totalAmount: number;
  amountPaid: number;
  status: "pending_deposit" | "secured" | "disbursed" | "refunded";
  mpesaCheckoutID?: string;
  createdAt: string;
}

export const useEscrow = (leadId?: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);

  // 1. Fetch active escrow pools from your data layer
  const fetchEscrowRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data matching your UI architecture values (e.g., Ksh 150,000.00)
      const mockData: EscrowTransaction[] = [
        {
          id: "ESC-8839",
          leadId: "lead-101",
          clientName: "John Smith",
          propertyTitle: "Milimani Heights Apartments - Unit 4B",
          totalAmount: 150000,
          amountPaid: 0,
          status: "pending_deposit",
          createdAt: new Date().toLocaleDateString(),
        }
      ];
      
      // Filter by specific lead if requested in component workspace
      const filtered = leadId ? mockData.filter(t => t.leadId === leadId) : mockData;
      setTransactions(filtered);
    } catch (err: any) {
      setError(err.message || "Failed to sync escrow data ledger.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fire Safaricom M-PESA Daraja API STK Push Request
  const initiateMpesaSTKPush = async (phoneNumber: string, amount: number, escrowId: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Triggering M-PESA STK Push to ${phoneNumber} for Ksh ${amount}`);
      
      // Hit your backend (Laravel / Flask API endpoint)
      // const response = await fetch('/api/v1/payments/stk-push', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phoneNumber, amount, escrowId })
      // });
      // const data = await response.json();

      // Simulate instantaneous safe network dispatch acknowledgment
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Update local state instance status to show payment processing pipeline
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === escrowId 
            ? { ...t, mpesaCheckoutID: "ws_CO_16062026_XYZ", amountPaid: amount, status: "secured" } 
            : t
        )
      );
      
      return { success: true, message: "STK Push prompt dispatched to client handset successfully." };
    } catch (err: any) {
      setError(err.message || "M-PESA dynamic gateway handshake dropped.");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 3. Disburse Secured Funds directly to Landlord/Seller
  const disburseEscrowPool = async (escrowId: string) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setTransactions((prev) =>
        prev.map((t) => t.id === escrowId ? { ...t, status: "disbursed" } : t)
      );
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrowRecords();
  }, [leadId]);

  return {
    loading,
    error,
    transactions,
    initiateMpesaSTKPush,
    disburseEscrowPool,
    refresh: fetchEscrowRecords
  };
};