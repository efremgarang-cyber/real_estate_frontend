import React, { useState } from "react";
import { X, CreditCard, Loader2, DollarSign, Smartphone, AlertCircle, Home, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Lead } from "../types";
import { formatCurrency, cn } from "../lib/utils";
import { api } from "../lib/api"; 

interface CloseDealModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void; // Triggered to refresh baseline application data safely
}

export const CloseDealModal: React.FC<CloseDealModalProps> = ({ lead, onClose, onSuccess }) => {
  // 1. Core Transaction States
  const [submitting, setSubmitting] = useState(false);
  const [stkPushSent, setStkPushSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 2. Safe Extraction of Property Links (Accommodates legacy missing data)
  const initialPropertyId = lead.property_id || (lead as any).property?.id || "";
  const [propertyId, setPropertyId] = useState<string>(initialPropertyId.toString());

  // 3. Form Input Management States
  const [salePrice, setSalePrice] = useState(lead.value || "");
  const [commissionRate, setCommissionRate] = useState("5");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [phoneNumber, setPhoneNumber] = useState(lead.phone || "");

  // Dynamic Commission Aggregator Logic
  const calculatedCommission = (Number(salePrice) * Number(commissionRate)) / 100;

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    // Strict Backend Protection Guardrail
    if (!propertyId || propertyId.trim() === "") {
      setErrorMessage("Transaction Blocked: Valid Property ID required to match asset parameters.");
      return;
    }

    try {
      setSubmitting(true);

      if (paymentMethod === "mpesa") {
        // Sanitize phone input to uniform Kenyan Dial Code Guidelines (254...)
        let formattedPhone = phoneNumber.replace(/\D/g, ''); 
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '254' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('254')) {
          setErrorMessage("Invalid Phone Format: Please input a valid Safaricom string (e.g., 2547...).");
          setSubmitting(false);
          return;
        }

        // Dispatch payload downstream to the Daraja STK Push Gateway Controller
        await api.post('/payments/stk-push', {
          phone_number: formattedPhone,
          amount: calculatedCommission, // Testing standard: 1 Shilling (KES 20 at 5% Comm)
          lead_id: lead.id,
          property_id: parseInt(propertyId) 
        });

        // Toggle state to reflect successful gateway ingestion (Waiting on Client PIN Input)
        setStkPushSent(true);
        onSuccess(); // Trigger background state syncs safely
      } else {
        // Fallback for Manual Clearing Paths (Direct Bank Wires)
        await api.patch(`/leads/${lead.id}/kanban`, { kanban_stage: "closed" });
        onSuccess();
        onClose();
      }

    } catch (err: any) {
      console.error("Critical error inside transactional module checkout loop:", err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        const compiledMsg = errors ? Object.values(errors).flat().join(", ") : "Validation rejection.";
        setErrorMessage(`Daraja Rejection (422): ${compiledMsg}`);
      } else {
        setErrorMessage(err.response?.data?.message || "Gateway unreachable. Check your service routing connections.");
      }
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
        className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 overflow-y-auto max-h-[90vh] border border-gray-100"
      >
        {/* Header Block Container */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 block mb-1">
              {stkPushSent ? "Gateway Active" : "Finalize Pipeline Deal"}
            </span>
            <h3 className="font-display text-2xl font-bold text-[#141414]">
              {stkPushSent ? "Awaiting Verification" : "Close & Pay"}
            </h3>
          </div>
          <button title="Dismiss Modal Window" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Polished, Normalized Notifications Alert Deck */}
        <div className="space-y-3 mb-5">
          <AnimatePresence mode="popLayout">
            {/* 1. Missing Property Link Alert */}
            {!stkPushSent && (!propertyId || propertyId.trim() === "") && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="p-4 bg-amber-50 rounded-xl flex items-start gap-3 border border-amber-200"
              >
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-0.5">Legacy Data Link Found</h4>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    This lead profile lacks an attached property asset link. Please enter an accurate reference code below to restore schema integrity.
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. Standard Error Block Layout */}
            {errorMessage && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-50 rounded-xl flex items-start gap-3 border border-red-200"
              >
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-0.5">Execution Interrupted</h4>
                  <p className="text-xs text-red-600 font-medium leading-relaxed">{errorMessage}</p>
                </div>
              </motion.div>
            )}

            {/* 3. Asynchronous Safe M-Pesa Instruction Slate */}
            {stkPushSent && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-emerald-50 rounded-2xl flex flex-col items-center text-center gap-3 border border-emerald-200"
              >
                <div className="p-3 bg-emerald-500 rounded-full text-white animate-bounce">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-1">STK Push Broadcasted!</h4>
                  <p className="text-xs text-emerald-700 font-medium leading-relaxed max-w-xs mx-auto">
                    A secure authentication request has been forwarded to phone handset <strong className="font-bold text-emerald-900">+{phoneNumber}</strong>. 
                    Please enter your M-Pesa PIN on the target interface to authenticate escrow release.
                  </p>
                </div>
                <div className="w-full mt-2 pt-3 border-t border-emerald-100 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest animate-pulse">
                    Monitoring backend webhooks for validation confirmations...
                  </span>
                  <button type="button" onClick={onClose} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors mt-2">
                    Return to Pipeline Board
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form Interactive Context Area */}
        {!stkPushSent && (
          <form onSubmit={handleProcessPayment} className="space-y-4">
            {/* Relational Entity Linking Data Input */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Target Property ID Linker</label>
              <div className="relative">
                <Home className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                <input 
                  type="number" 
                  required 
                  value={propertyId} 
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="Ex. 6"
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border rounded-xl text-sm transition-all font-bold text-[#141414] focus:outline-none",
                    !propertyId ? "bg-amber-50/40 border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500" : "bg-gray-50/50 border-gray-200 focus:border-[#141414]"
                  )}
                />
              </div>
            </div>

            {/* Total Aggregate Value Field */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Final Closed Sale Value (KES)</label>
              <input 
                type="number" required value={salePrice} onChange={(e) => setSalePrice(e.target.value)} 
                placeholder="For a 1 shilling push at 5%, use 20"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-all text-sm font-medium text-[#141414]" 
              />
            </div>

            {/* Split Percentage Allocation Blocks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Commission Apportioned (%)</label>
                <input title="commissionrate"
                  type="number" required value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} 
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-all text-sm font-medium text-[#141414]" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Daraja Push Target Payload</label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-green-600 flex items-center justify-between">
                  <span className="truncate">{formatCurrency(calculatedCommission).replace('KES', '')}</span>
                  <DollarSign size={14} className="shrink-0 ml-1 text-green-500" />
                </div>
              </div>
            </div>

            {/* Gateway Infrastructure Selector */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Settlement Architecture</label>
              <select title="paymentmethod"
                value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-all text-sm font-medium cursor-pointer text-[#141414]"
              >
                <option value="mpesa">M-Pesa Escrow Automated Hook</option>
                <option value="bank_transfer">Direct Manual Wire Clearing</option>
              </select>
            </div>

            {/* Conditional Phone String Entry Point */}
            {paymentMethod === "mpesa" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Payer Secure Subscriber Sequence</label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                  <input 
                    type="text" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-all text-sm font-medium text-[#141414]" 
                    placeholder="2547XXXXXXXX"
                  />
                </div>
              </motion.div>
            )}

            {/* Submission Triggers */}
            <button 
              type="submit" disabled={submitting} 
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-70 shadow-sm"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {submitting ? "Initiating Handset Secure Push..." : "Confirm Payment & Close"}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};