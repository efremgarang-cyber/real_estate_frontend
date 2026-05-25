import React, { useState } from "react";
import { X, CreditCard, Loader2, DollarSign, Building } from "lucide-react";
import { motion } from "motion/react";
import { Lead } from "../types";
import { leadApi } from "../api/leads";
import { formatCurrency } from "../lib/utils";
// import { paymentApi } from "../api/payments"; // Import your actual payments API here

interface CloseDealModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

export const CloseDealModal: React.FC<CloseDealModalProps> = ({ lead, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [salePrice, setSalePrice] = useState(lead.value || "");
  const [commissionRate, setCommissionRate] = useState("5");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  const calculatedCommission = (Number(salePrice) * Number(commissionRate)) / 100;

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Hit your Payments API first
      // await paymentApi.process({
      //   lead_id: lead.id,
      //   amount: calculatedCommission,
      //   method: paymentMethod,
      //   sale_price: Number(salePrice)
      // });

      // 2. Once payment succeeds, move the lead to the closed stage
      await leadApi.updateKanbanStage(lead.id, "closed");
      
      onSuccess();
    } catch (err) {
      console.error("Payment processing failed:", err);
      alert("Failed to process payment. Please verify transaction details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#141414]/40 backdrop-blur-sm flex items-center justify-center p-6 font-sans"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 block mb-1">Finalize Deal</span>
            <h3 className="font-display text-2xl font-bold text-[#141414]">Close & Pay</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Client</p>
          <p className="font-bold text-[#141414]">{lead.name}</p>
        </div>

        <form onSubmit={handleProcessPayment} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Final Sale Price (KES)</label>
            <input 
              type="number" required value={salePrice} onChange={(e) => setSalePrice(e.target.value)} 
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all font-medium text-[#141414]" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Commission (%)</label>
              <input 
                type="number" required value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all font-medium text-[#141414]" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Agency Payout</label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-green-600 flex items-center justify-between">
                <span>{formatCurrency(calculatedCommission).replace('KES', '')}</span>
                <DollarSign size={16} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Method</label>
            <select 
              value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium cursor-pointer"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mpesa">M-Pesa Escrow</option>
              <option value="cheque">Certified Cheque</option>
            </select>
          </div>

          <button 
            type="submit" disabled={submitting} 
            className="w-full flex items-center justify-center gap-2 py-4 mt-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors disabled:opacity-70 shadow-sm"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
            {submitting ? "Processing Transaction..." : "Confirm Payment & Close"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};