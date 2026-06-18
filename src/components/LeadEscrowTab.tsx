import React, { useState, useEffect } from "react";
import { Shield, Loader2, CheckCircle, ArrowRight, AlertCircle, ExternalLink } from "lucide-react";
import { EscrowEngine } from "../../lib/escrowEngine";
import { ArcAiEvaluator } from "../../lib/aiEvaluator";
import { supabase } from "../../supabase";

interface LeadEscrowTabProps {
  propertyId: number;
  leadId: number;
  leadValue: number;
  leadName: string;
}

export const LeadEscrowTab: React.FC<LeadEscrowTabProps> = ({
  propertyId,
  leadId,
  leadValue,
  leadName,
}) => {
  const [escrow, setEscrow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fallback testing credentials matching your backend system layer
  const CURRENT_USER_ROLE: "CLIENT" | "PROVIDER" | "EVALUATOR" = "CLIENT";
  const TEST_CLIENT_ID = "cc885ea1-42cb-4654-8e31-972db4ba1b9d";
  const TEST_PROVIDER_ID = "99999999-9999-9999-9999-999999999999";

  // 1. Fetch any existing agreement linked to this lead on component mount
  const loadEscrowRecord = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: dbError } = await supabase
        .from("arc_escrows")
        .select("*")
        // Checks for agreements matched to this client's signature identifier
        .eq("client_id", TEST_CLIENT_ID) 
        .order("created_at", { ascending: false })
        .limit(1);

      if (dbError) throw dbError;
      if (data && data.length > 0) {
        setEscrow(data[0]);
      }
    } catch (err: any) {
      console.error("Failed loading escrow context data lines:", err);
      setError("Unable to sync database state markers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscrowRecord();
  }, [leadId]);

  // 2. Initialize a clean ERC-8183 agreement state frame
  const handleCreateAgreement = async () => {
    if (leadValue <= 0) {
      setError("Cannot initialize an escrow pool vault with a KES 0.00 valuation.");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const agreement = await EscrowEngine.createAgreement({
        clientId: TEST_CLIENT_ID,
        providerId: TEST_PROVIDER_ID,
        evaluatorId: "GEMINI_AUTONOMOUS_AGENT",
        budget: leadValue,
        contractDetails: `Verify that the formal land registry allocations, verified site inspection checklists, and verified key turnovers matching transaction sequence client account '${leadName}' are executed completely without discrepancy.`,
        durationDays: 14,
      });

      setEscrow(agreement);
    } catch (err: any) {
      setError(err.message || "Failed initializing ledger vault handshake.");
    } finally {
      setProcessing(false);
    }
  };

  // 3. Move state boundary: OPEN -> FUNDED
  const handleFundVault = async () => {
    try {
      setProcessing(true);
      const updated = await EscrowEngine.lockFunds(escrow.id);
      setEscrow(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // 4. Move state boundary: FUNDED -> SUBMITTED and trigger the Gemini evaluation loop
  const handleSubmission = async () => {
    if (!deliverableUrl.trim()) return;
    try {
      setProcessing(true);
      
      // Update DB to SUBMITTED state context
      const updated = await EscrowEngine.submitDeliverable(escrow.id, escrow.provider_id, deliverableUrl);
      setEscrow(updated);

      // Async background trigger for Gemini protocol processing
      ArcAiEvaluator.evaluateSubmitedWork(escrow.id).then(() => {
        loadEscrowRecord(); // Hot-reload view when decision commits
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-amber-50 text-amber-800 border-amber-200";
      case "FUNDED": return "bg-blue-50 text-blue-800 border-blue-200";
      case "SUBMITTED": return "bg-purple-50 text-purple-800 border-purple-200 animate-pulse";
      case "COMPLETED": return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "REFUNDED": return "bg-rose-50 text-rose-800 border-rose-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-gray-400" size={24} />
        <p className="text-xs font-medium text-gray-400">Syncing security ledger parameters...</p>
      </div>
    );
  }

  // INITIAL STATE PANEL: Renders if no active agreement exists yet for this profile
  if (!escrow) {
    return (
      <div className="text-center py-10 px-4 bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl">
        <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Shield className="text-gray-400" size={22} />
        </div>
        <h4 className="text-sm font-bold text-[#141414] mb-1">No Active Escrow Pool Account</h4>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
          Initialize a secure ERC-8183 escrow pool boundary to secure funds before proceeding with final handshakes for {leadName}.
        </p>
        
        {error && (
          <div className="mb-4 text-xs font-medium text-rose-600 flex items-center justify-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-100 max-w-md mx-auto">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button
          onClick={handleCreateAgreement}
          disabled={processing}
          className="bg-[#141414] text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-black transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
        >
          {processing ? <Loader2 size={14} className="animate-spin" /> : "Deploy Escrow Contract Vault"}
        </button>
      </div>
    );
  }

  // ACTIVE STATE CONSOLE PANEL
  return (
    <div className="space-y-6">
      {/* Contract Header Block */}
      <div className="p-5 bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] rounded-2xl flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-gray-400 block uppercase">Vault Target Value</span>
          <span className="text-2xl font-black text-[#141414]">
            KES {escrow.budget.toLocaleString()}
          </span>
        </div>
        <div className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border ${getStatusStyle(escrow.status)}`}>
          {escrow.status}
        </div>
      </div>

      {error && (
        <div className="text-xs font-medium text-rose-600 flex items-center gap-1.5 bg-rose-50 p-3 rounded-xl border border-rose-100">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Contract Terms Text Block */}
      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">ERC-8183 Verification Directive</h5>
        <p className="text-xs text-gray-600 leading-relaxed font-medium">{escrow.contract_details}</p>
      </div>

      {/* DYNAMIC WORKFLOW INTERFACES */}
      {escrow.status === "OPEN" && CURRENT_USER_ROLE === "CLIENT" && (
        <div className="p-5 bg-amber-50/40 border border-amber-100 rounded-2xl space-y-4">
          <p className="text-xs text-amber-800 font-medium leading-normal">
            The handshake contract is active. Secure the valuation capital inside the platform pool to signal your intent to complete the transaction.
          </p>
          <button
            onClick={handleFundVault}
            disabled={processing}
            className="w-full bg-[#141414] text-white text-xs font-semibold py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 size={14} className="animate-spin" /> : "Simulate Payment Clearance & Lock Funds"}
          </button>
        </div>
      )}

      {escrow.status === "FUNDED" && (
        <div className="p-5 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-4">
          <div>
            <h5 className="text-xs font-bold text-blue-900 mb-1">Upload Completion Evidence</h5>
            <p className="text-xs text-blue-700/80 leading-normal">
              Paste the public verification link containing title checks or keys sign-off documents to trigger Gemini autonomous adjudication evaluation.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., https://registry.makao.co.ke/verification/doc_id"
              value={deliverableUrl}
              onChange={(e) => setDeliverableUrl(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414] transition-all"
            />
            <button
              onClick={handleSubmission}
              disabled={processing || !deliverableUrl.trim()}
              className="bg-blue-600 text-white text-xs font-semibold px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center"
            >
              {processing ? <Loader2 size={14} className="animate-spin" /> : "Submit"}
            </button>
          </div>
        </div>
      )}

      {escrow.status === "SUBMITTED" && (
        <div className="p-6 text-center border border-purple-100 bg-purple-50/30 rounded-2xl space-y-4">
          <Loader2 className="animate-spin text-purple-600 mx-auto" size={24} />
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-purple-900">Gemini Parsing In Progress...</h5>
            <p className="text-[11px] text-purple-700/70 max-w-xs mx-auto leading-normal">
              The autonomous audit node is scanning your deliverable artifact link against the ledger's verification directive text block.
            </p>
          </div>
          <div className="text-[10px] font-mono text-gray-400 bg-white border border-gray-100 px-3 py-1.5 rounded-lg truncate max-w-xs mx-auto flex items-center justify-center gap-1">
            <ExternalLink size={10} /> {escrow.deliverable_url}
          </div>
        </div>
      )}

      {(escrow.status === "COMPLETED" || escrow.status === "REFUNDED") && (
        <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
          escrow.status === "COMPLETED" ? "bg-emerald-50/40 border-emerald-100 text-emerald-900" : "bg-rose-50/40 border-rose-100 text-rose-900"
        }`}>
          <CheckCircle className={`shrink-0 mt-0.5 ${escrow.status === "COMPLETED" ? "text-emerald-600" : "text-rose-600"}`} size={18} />
          <div className="space-y-1.5">
            <h5 className="text-xs font-bold">Contract Finalized</h5>
            <p className="text-xs font-medium opacity-80 leading-relaxed">{escrow.evaluation_notes}</p>
            <span className="text-[9px] font-mono text-gray-400 tracking-wider block pt-1">
              TERMINAL TIMESTAMP: {new Date(escrow.updated_at).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};