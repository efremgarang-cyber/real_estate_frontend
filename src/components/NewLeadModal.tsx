import React, { useState } from "react";
import { X, Loader2, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { leadApi } from "../api/leads";
import { useAuth } from "../../src/lib/AuthContext";

interface NewLeadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [value, setValue] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await leadApi.create({
        agency_id: profile?.agencyId,
        name,
        email,
        phone,
        value: value ? String(value) : undefined,
        kanban_stage: "new", // Enforces baseline entry point status
      } as any);
      onSuccess();
    } catch (err) {
      console.error("Failed to persist new pipeline lead track:", err);
      alert("Error saving lead information. Please check fields and retry.");
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
        className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-bold text-[#141414]">Create Pipeline Lead</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lead Name / Entity</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. David Mwangi" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="buyer@domain.com" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +254 7XXXXXXXX" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Estimated Deal Value (KES)</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Valuation" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm" />
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-[#141414] hover:bg-black text-white rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-sm"
          >
            {submitting ? "Initializing Pipeline Tracking..." : "Intake Lead"}
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};