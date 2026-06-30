import React, { useState, useEffect, useRef } from "react";
import { X, ShieldAlert, Loader2, Home, ArrowRight, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Lead } from "../types";
import { cn } from "../lib/utils";
import { api } from "../lib/api"; 

interface CloseDealModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: (updatedLead: Lead) => void;
}

export const CloseDealModal: React.FC<CloseDealModalProps> = ({ lead, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stkPushSent, setStkPushSent] = useState(false);

  // Real-Time Polling & Verification Cycles
  const [verificationStatus, setVerificationStatus] = useState<'polling' | 'success' | 'cancelled' | 'timeout'>('polling');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Safe Extraction of Property Links
  const [propertyId, setPropertyId] = useState<string>((lead.property_id || (lead as any).property?.id || "").toString());

  // Form Input Management States
  const [salePrice, setSalePrice] = useState<string | number>(lead.value || "");
  const [commissionRate, setCommissionRate] = useState<string>("5");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "bank_transfer">("mpesa");
  const [phoneNumber, setPhoneNumber] = useState<string>(lead.phone || "");

  // Provider details for escrow handoff
  const [providerEmail, setProviderEmail] = useState("");
  const [providerPhone, setProviderPhone] = useState("");

  const calculatedCommission = (Number(salePrice) * Number(commissionRate)) / 100;

  // Cleanup active intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const startPollingStatus = (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 30;
    setVerificationStatus('polling');

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;

      try {
        const statusResponse = await api.get(`/payments/status/${checkoutRequestId}`);
        const currentStatus = statusResponse.data.status;

        if (currentStatus === 'held_in_escrow') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setVerificationStatus('success');
          onSuccess(lead);
        } 
        else if (currentStatus === 'cancelled' || currentStatus === 'failed') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setVerificationStatus('cancelled');
          setStkPushSent(false);
          setErrorMessage("Transaction aborted: Request declined on handset device.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      if (attempts >= maxAttempts) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setVerificationStatus('timeout');
        setStkPushSent(false);
        setErrorMessage("Verification timeout: Gateway connection dropped.");
      }
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!propertyId || propertyId.trim() === "") {
      setErrorMessage("Transaction Blocked: A valid Property Reference ID is required.");
      return;
    }

    if (!providerEmail || !providerPhone) {
      setErrorMessage("Please fill in the provider details for the asset payout assignment.");
      return;
    }

    try {
      setSubmitting(true);

      if (paymentMethod === "mpesa") {
        let formattedPhone = phoneNumber.replace(/\D/g, ''); 
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '254' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('254')) {
          setErrorMessage("Invalid Phone Format: Please input a valid Safaricom number (2547...).");
          setSubmitting(false);
          return;
        }

        // 1. Update kanban stage
        await api.patch(`/leads/${lead.id}/kanban`, { 
          kanban_stage: "closed",
          value: salePrice,
          property_id: parseInt(propertyId)
        });
        
        // 2. Dispatch STK Push
        const response = await api.post('/payments/stk-push', {
          phone_number: formattedPhone,
          amount: calculatedCommission, 
          lead_id: lead.id,
          property_id: parseInt(propertyId, 10) 
        });

        if (response.data.success) {
          const checkoutRequestId = response.data.daraja.CheckoutRequestID;
          setStkPushSent(true);
          startPollingStatus(checkoutRequestId);
        } else {
          setErrorMessage("Could not trigger payment gateway initialization.");
        }
      } else {
        // Direct manual wire flow
        await api.patch(`/leads/${lead.id}/kanban`, { kanban_stage: "closed" });
        onSuccess(lead);
        onClose();
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(err.response?.data?.message || "Failed to process. Verify database state.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#141414]/40 backdrop-blur-sm flex items-center justify-center p-6 font-sans"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 10 }} 
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 overflow-y-auto max-h-[90vh] border border-gray-100"
      >
        {/* Header Block */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block mb-1">
              Direct Workflow Vault Transit
            </span>
            <h3 className="font-display text-2xl font-bold text-[#141414]">
              {stkPushSent ? "Verification Engine" : "Handoff to Escrow"}
            </h3>
          </div>
          <button title="Dismiss Modal" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Notifications */}
        <div className="space-y-3 mb-5">
          <AnimatePresence mode="popLayout">
            {!stkPushSent && (!propertyId || propertyId.trim() === "") && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="p-4 bg-amber-50 rounded-xl flex items-start gap-3 border border-amber-200"
              >
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-0.5">Missing Property Link</h4>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    This lead lacks an attached property. Enter a valid Property ID below.
                  </p>
                </div>
              </motion.div>
            )}

            {errorMessage && !stkPushSent && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="p-4 bg-red-50 rounded-xl flex items-start gap-3 border border-red-200"
              >
                <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-0.5">Error</h4>
                  <p className="text-xs text-red-700 font-medium leading-relaxed">{errorMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {stkPushSent ? (
          <div className="text-center py-6 space-y-4">
            {verificationStatus === "polling" && (
              <>
                <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-full animate-pulse">
                  <Loader2 size={32} className="animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-[#141414]">STK Push Sent</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Please check your phone and enter your M-Pesa PIN to authorize the transaction.
                  </p>
                </div>
              </>
            )}
            
            {verificationStatus === "success" && (
              <>
                <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-full">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-[#141414]">Payment Successful</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Commission cleared. Escrow has been updated.
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Property ID */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Target Property ID</label>
              <div className="relative">
                <Home className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                <input 
                  type="number" 
                  required 
                  value={propertyId} 
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="e.g. 6"
                  className={cn(
                    "w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-bold text-[#141414] focus:outline-none focus:border-[#141414] bg-gray-50/50 border-gray-200"
                  )}
                />
              </div>
            </div>

            {/* Sale Price */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Agreed Sale Price (KES)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-xs font-bold text-gray-400">Ksh</span>
                <input 
                  type="number" required value={salePrice} onChange={(e) => setSalePrice(e.target.value)} 
                  placeholder="e.g. 2500000"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] text-sm font-bold text-[#141414]" 
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Payment Method</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("mpesa")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    paymentMethod === "mpesa" 
                      ? "bg-[#141414] text-white border-[#141414]" 
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  M-Pesa
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    paymentMethod === "bank_transfer" 
                      ? "bg-[#141414] text-white border-[#141414]" 
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  Bank Transfer
                </button>
              </div>
            </div>

            {paymentMethod === "mpesa" && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#141414] focus:outline-none focus:border-[#141414]"
                />
                <p className="text-xs text-gray-400 mt-1">Commission: KES {calculatedCommission.toLocaleString()}</p>
              </div>
            )}

            {/* Provider Details */}
            <div className="border-t border-gray-100 pt-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Provider / Seller Details</span>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Provider Email *</label>
                  <input 
                    type="email" required value={providerEmail} onChange={(e) => setProviderEmail(e.target.value)}
                    placeholder="seller@domain.com"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#141414] focus:outline-none focus:border-[#141414]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Provider Phone *</label>
                  <input 
                    type="tel" required value={providerPhone} onChange={(e) => setProviderPhone(e.target.value)}
                    placeholder="2547XXXXXXXX"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#141414] focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>
            </div>

            {/* Commission Rate */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Commission Rate (%)</label>
              <div className="flex gap-3 items-center">
                <input 
                  type="number" 
                  value={commissionRate} 
                  onChange={(e) => setCommissionRate(e.target.value)}
                  min="1" 
                  max="100"
                  className="w-20 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#141414] focus:outline-none focus:border-[#141414]"
                />
                <span className="text-xs text-gray-500">= KES {calculatedCommission.toLocaleString()}</span>
              </div>
            </div>

            <button 
              type="submit" disabled={submitting} 
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-70 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Initialize Escrow Channel</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};