import React, { useState, useEffect } from "react";
import { X, CreditCard, MessageSquare, History, Loader2, Plus, Shield } from "lucide-react";
import { motion } from "motion/react";
import { cn, formatCurrency } from "../lib/utils";
import { Lead } from "../types";
import { leadApi } from "../api/leads";
import { LeadEscrowTab } from "./Escrow/LeadEscrowTab"; // ✅ FIXED: Changed from LeadSearchTab to LeadEscrowTab

interface LeadDetailModalProps {
  leadId: number;
  onClose: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ leadId, onClose }) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'escrow'>('overview'); // ✅ ADDED: Tab state
  const [loading, setLoading] = useState(true);
  const [updatingOffer, setUpdatingOffer] = useState(false);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const response = await leadApi.getById(leadId);
      setLead(response.data);
      
      const initialValue = response.data.value ? parseFloat(response.data.value) : 0;
      setOfferPrice(isNaN(initialValue) ? 0 : initialValue);
    } catch (error) {
      console.error("Error reading lead database:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId]);

  const handleUpdateOffer = async () => {
    if (!lead) return;
    setUpdatingOffer(true);
    try {
      await leadApi.update(lead.id, { value: String(offerPrice) });
      await fetchLeadDetails();
    } catch (error) {
      console.error("Failed updating valuation:", error);
    } finally {
      setUpdatingOffer(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#141414]/40 backdrop-blur-sm flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!lead) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#141414]/40 backdrop-blur-sm flex items-center justify-end p-4 md:p-6 font-sans"
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-2xl h-full bg-white rounded-4xl shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">Lead Profile</span>
            <h2 className="text-3xl font-bold text-[#141414] tracking-tight">
              {lead.name}
            </h2>
          </div>
          <button title="onclose" onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-[#141414] rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* ✅ ADDED: Tab Navigation */}
        <div className="border-b border-gray-100 px-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "pb-3 text-sm font-medium transition-colors",
                activeTab === 'overview' ? "text-[#141414] border-b-2 border-[#141414]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('escrow')}
              className={cn(
                "pb-3 text-sm font-medium transition-colors flex items-center gap-2",
                activeTab === 'escrow' ? "text-[#141414] border-b-2 border-[#141414]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Shield size={14} />
              Escrow
            </button>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' ? (
          <div className="p-8 space-y-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Pipeline Stage</span>
                <span className="font-bold text-[#141414] text-sm uppercase">{lead.kanban_stage.replace('_', ' ')}</span>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Contract Valuation</span>
                <span className="font-bold text-[#141414] text-sm">
                  {lead.value ? formatCurrency(parseFloat(lead.value)) : "TBD"}
                </span>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Contact</span>
                <span className="font-bold text-[#141414] text-sm block truncate">{lead.phone || "No Phone Data"}</span>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Assignment</span>
                <span className="font-bold text-blue-600 text-sm block truncate">
                  {lead.assigned_agent ? lead.assigned_agent.name : "Unassigned"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="bg-white border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-4xl p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                    <CreditCard size={16} /> Financial Overview
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">
                        Proposed Transaction Value (KES)
                      </label>
                      <div className="flex gap-2">
                        <input title="offerprice"
                          type="number" 
                          value={offerPrice || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setOfferPrice(isNaN(val) ? 0 : val);
                          }}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-[#141414] focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
                        />
                        <button 
                          onClick={handleUpdateOffer}
                          disabled={updatingOffer}
                          className="bg-[#141414] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black disabled:opacity-50 transition-colors shrink-0"
                        >
                          {updatingOffer ? <Loader2 size={16} className="animate-spin" /> : "Update"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <MessageSquare size={16} /> Log Interaction
                  </h3>
                  <textarea 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Type internal summary comments here..."
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-[#141414] placeholder:text-gray-400 resize-none focus:outline-none focus:border-[#141414] focus:bg-white transition-colors"
                  />
                  <button 
                    onClick={() => {
                      console.log("Saving log interaction details:", newNote);
                      setNewNote("");
                    }}
                    className="w-full mt-4 bg-gray-100 text-[#141414] font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={16} /> Update Client Record
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                  <History size={16} /> Timeline Logs
                </h3>
                <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-0 before:w-px before:bg-gray-200">
                  {lead.activities?.map((activity) => (
                    <div key={activity.id} className="relative pl-12">
                      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#141414] z-10" />
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl text-sm text-gray-600">
                        {activity.description}
                      </div>
                    </div>
                  ))}
                  {(!lead.activities || lead.activities.length === 0) && (
                    <p className="text-sm font-medium text-gray-400 mt-8 pl-4">
                      No timeline logs recorded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ✅ Escrow Tab Content */
          <div className="p-8">
            <LeadEscrowTab 
              propertyId={lead.id}
              leadId={lead.id}
              leadValue={lead.value ? parseFloat(lead.value) : 0}
              leadName={lead.name}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};