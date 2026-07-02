import React, { useState } from "react";
import { useAuth } from "@/src/lib/AuthContext";
import { ArrowRight, AlertCircle, Building2 } from "lucide-react";

export const AgencySetupView: React.FC = () => {
  const { user, createAgencyAndProfile } = useAuth();
  const [agencyName, setAgencyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agencyError, setAgencyError] = useState<string | null>(null);

  const handleCreateAgency = async () => {
    setIsProcessing(true); setAgencyError(null);
    try {
      await createAgencyAndProfile(agencyName, "Admin");
    } catch (error: any) {
      setAgencyError(error.response?.data?.message || "Failed to create agency. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-6 font-sans">
      <div className="max-w-md w-full p-10 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 rounded-full bg-[#141414] text-white flex items-center justify-center mx-auto mb-6 shadow-md">
          <Building2 size={28} />
        </div>

        <h2 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">Establish Workspace</h2>
        <p className="text-sm text-center text-gray-500 mb-8">
          Welcome, <span className="font-bold text-[#141414]">{user?.name || 'Admin'}</span>. Set up your multi-tenancy business ledger name.
        </p>

        {agencyError && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-600">{agencyError}</p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Legal Agency Name</label>
            <input
              type="text" placeholder="e.g. Makao Prime Properties"
              value={agencyName} onChange={(e) => { setAgencyName(e.target.value); if (agencyError) setAgencyError(null); }}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-colors text-sm text-[#141414]"
            />
          </div>
          <button
            disabled={!agencyName || isProcessing} onClick={handleCreateAgency}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Initializing Tenant..." : "Create Agency Core"}
            {!isProcessing && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};