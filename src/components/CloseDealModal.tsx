// 📁 File: src/components/CloseDealModal.tsx
import React, { useState } from "react";
import { X, ShieldAlert, Loader2, Home, ArrowRight, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Lead } from "../types";
import { cn } from "../lib/utils";
import { api } from "../lib/api"; 

interface CloseDealModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: (updatedLead: Lead) => void; // Hands back the structured lead context directly to Kanban routing hooks
}

export const CloseDealModal: React.FC<CloseDealModalProps> = ({ lead, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Safe extraction of Property ID links
  const initialPropertyId = lead.property_id || (lead as any).property?.id || "";
  const [propertyId, setPropertyId] = useState<string>(initialPropertyId.toString());

  // Input states initialized dynamically from lead metrics
  const [salePrice, setSalePrice] = useState(lead.value || "");
  const [providerEmail, setProviderEmail] = useState("");
  const [providerPhone, setProviderPhone] = useState("");

  const handlePipelineHandoff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!propertyId || propertyId.trim() === "") {
      setErrorMessage("Transaction Blocked: A valid Property Reference ID is required to link escrow parameters.");
      return;
    }

    if (!providerEmail || !providerPhone) {
      setErrorMessage("Please fill in the provider details to map the asset payout assignment.");
      return;
    }

    try {
      setSubmitting(true);

      // 1. Instantly transition Kanban stage block parameters on your backend
      const response = await api.patch(`/leads/${lead.id}/kanban`, { 
        kanban_stage: "closed",
        value: salePrice,
        property_id: parseInt(propertyId)
      });
      
      // 2. Synthesize unified structural layout payload to deliver over to the Escrow workspace state
      const handoffContext: Lead & { leadContext?: any } = {
        ...lead,
        kanban_stage: "closed",
        value: salePrice,
        property_id: parseInt(propertyId),
        // Custom wrapper properties matching Escrow Page expectation maps
        leadContext: {
          clientName: lead.name,
          clientEmail: lead.email || `${lead.name.toLowerCase().replace(/\s+/g, '')}@client.com`,
          providerName: "Property Provider Asset Owner",
          providerEmail: providerEmail,
          providerPhone: providerPhone,
          description: lead.title || `Escrow Settlement for Property Unit #${propertyId}`,
          amount: salePrice
        }
      };

      // 3. Fire layout tracking context trigger to initiate redirect
      onSuccess(handoffContext);
      onClose();

    } catch (err: any) {
      console.error("Pipeline handoff transmission layout crash:", err);
      setErrorMessage(err.response?.data?.message || "Failed to finalize pipeline stage transition. Verify local database schema state.");
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
        {/* Header Block */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 block mb-1">
              Direct Workflow Vault Transit
            </span>
            <h3 className="font-display text-2xl font-bold text-[#141414]">
              Handoff to Escrow
            </h3>
          </div>
          <button title="Dismiss Modal" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* System Error Deck Display */}
        {errorMessage && (
          <div className="p-4 mb-4 bg-red-50 rounded-xl flex items-start gap-3 border border-red-200">
            <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-0.5">Handoff Blocked</h4>
              <p className="text-xs text-red-600 font-medium leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handlePipelineHandoff} className="space-y-4">
          {/* Target Property Reference ID mapping input */}
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
                  "w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-bold text-[#141414] focus:outline-none focus:border-[#141414] bg-gray-50/50 border-gray-200"
                )}
              />
            </div>
          </div>

          {/* Deal Value Capture Block */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Agreed Transaction Value (KES)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-xs font-bold text-gray-400">Ksh</span>
              <input 
                type="number" required value={salePrice} onChange={(e) => setSalePrice(e.target.value)} 
                placeholder="e.g. 2500000"
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] text-sm font-bold text-[#141414]" 
              />
            </div>
          </div>

          <div className="border-t border-gray-100 my-2 pt-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Provider Assignment Configuration</span>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Provider/Seller Email *</label>
                <input 
                  type="email" required value={providerEmail} onChange={(e) => setProviderEmail(e.target.value)}
                  placeholder="seller@domain.com"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#141414] focus:outline-none focus:border-[#141414]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Provider Phone (M-Pesa Disbursal) *</label>
                <input 
                  type="tel" required value={providerPhone} onChange={(e) => setProviderPhone(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#141414] focus:outline-none focus:border-[#141414]"
                />
              </div>
            </div>
          </div>

          {/* Execution Button Layout */}
          <button 
            type="submit" disabled={submitting} 
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-70 shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Migrating Core Ledger State...</span>
              </>
            ) : (
              <>
                <span>Initialize Escrow Channel</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};