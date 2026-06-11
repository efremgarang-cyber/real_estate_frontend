import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Search,
  Filter,
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Users,
  Eye,
  RefreshCw,
  Download
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { StatusText } from "../../../components/StatusText";
import { DocumentViewer } from "../../../components/DocumentViewer";
import { api } from "../../../lib/api";
import { vaultApi } from "../../../api/vault";
import { KycDocument } from "../../../types";
import { cn } from "../../../lib/utils";

// Interface configuration for administrative metrics
interface VaultGlobalMetrics {
  totalPending: number;
  totalApproved: number;
  totalFlagged: number;
  totalCapacityBytes: number;
}

interface SecureKycDocument extends KycDocument {
  signedUrl?: string;
  agentName?: string;
  agentId?: string;
}

// Mock database for filtering views by active agent pools
const mockAgentRegistry = [
  { id: "all", name: "All Active Agents" },
  { id: "ag-01", name: "Sarah Jenkins" },
  { id: "ag-02", name: "Michael Chang" },
  { id: "ag-03", name: "Elena Rostova" },
];

export const AdminVaultPage: React.FC = () => {
  const [docs, setDocs] = useState<SecureKycDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<SecureKycDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<VaultGlobalMetrics>({
    totalPending: 14,
    totalApproved: 284,
    totalFlagged: 3,
    totalCapacityBytes: 4219430400 // ~3.93 GB used in MinIO/S3
  });

  const fetchGlobalVaultRegistry = async () => {
    setLoading(true);
    try {
      // Direct call targeting the global administrative index route
      const response = await api.get('/v1/admin/vault/documents');
      const data = response.data?.data || response.data || [];
      
      // Batch execute short-lived cryptographic signed links directly for secure MinIO display
      const signedDocs = await Promise.all(
        data.map(async (doc: any) => {
          const rawUrl = doc.s3_path || doc.url || doc.file_path;
          const signedUrl = rawUrl ? await vaultApi.getSignedUrl(rawUrl) : undefined;
          
          // Fallback mocking for agent assignments if backend payload missing explicit joins
          const assignedAgent = mockAgentRegistry[Math.floor(Math.random() * (mockAgentRegistry.length - 1)) + 1];

          return { 
            ...doc, 
            signedUrl,
            agentName: doc.agent?.name || assignedAgent.name,
            agentId: doc.agent_id || assignedAgent.id
          };
        })
      );

      setDocs(signedDocs);
    } catch (error) {
      console.error("Failed to fetch administrative vault matrix:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalVaultRegistry();
  }, []);

  // Inline status mutation handler for instant compliance processing
  const handleUpdateDocumentStatus = async (docId: string, currentStatus: string) => {
    setActioningId(docId);
    try {
      await api.patch(`/v1/admin/vault/documents/${docId}/status`, { status: currentStatus });
      
      // Update memory array dynamically
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: currentStatus as any } : d));
      
      // Adjust metrics tracking node states dynamically
      if (currentStatus === 'approved') {
        setMetrics(m => ({ ...m, totalApproved: m.totalApproved + 1, totalPending: Math.max(0, m.totalPending - 1) }));
      } else if (currentStatus === 'rejected') {
        setMetrics(m => ({ ...m, totalFlagged: m.totalFlagged + 1, totalPending: Math.max(0, m.totalPending - 1) }));
      }
    } catch (err) {
      console.error("Failed to commit compliance mutation status:", err);
      alert("System failed to update compliance state. Check network tokens.");
    } finally {
      setActioningId(null);
    }
  };

  // Comprehensive multi-tier administrative filter layout logic
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = 
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.userId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.agentName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAgent = selectedAgentFilter === "all" || doc.agentId === selectedAgentFilter;
    const matchesStatus = selectedStatusFilter === "all" || doc.status === selectedStatusFilter;

    return matchesSearch && matchesAgent && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* --- ADMINISTRATIVE ARCHITECTURE VAULT HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#141414] text-white rounded-2xl flex items-center justify-center shadow-md">
            <Shield size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Ecosystem Compliance Unit</span>
            <h1 className="text-xl font-black text-[#141414] tracking-tight">Central Storage & Document Vault</h1>
          </div>
        </div>

        <button 
          onClick={fetchGlobalVaultRegistry} 
          className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all text-gray-600 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        >
          <RefreshCw size={14} className={cn(loading && "animate-spin")} /> Re-Sync Registry
        </button>
      </div>

      {/* --- MACRO OVERVIEW STRIP --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Awaiting Verification</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-500 tracking-tight">{metrics.totalPending}</span>
            <span className="text-xs font-medium text-gray-400">files</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Validated Clearances</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-green-600 tracking-tight">{metrics.totalApproved}</span>
            <span className="text-xs font-medium text-gray-400">passed</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flagged Exceptions</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-red-600 tracking-tight">{metrics.totalFlagged}</span>
            <span className="text-xs font-medium text-gray-400">quarantined</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Infrastructure Usage</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-[#141414] tracking-tight">
              {(metrics.totalCapacityBytes / (1024 * 1024 * 1024)).toFixed(2)}
            </span>
            <span className="text-xs font-mono font-bold text-gray-400">GB / 10GB</span>
          </div>
        </div>
      </div>

      {/* --- COMMAND TOOLBAR AND MULTI-AXIS FILTERS --- */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        
        {/* Universal Fuzzy Match Search String */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search documents by Client ID, format type, or uploaded agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-[#141414] focus:bg-white transition-all text-xs font-semibold shadow-inner"
          />
        </div>

        {/* Dynamic Assigned Agent Dimension Selector */}
        <div className="relative">
          <select
            value={selectedAgentFilter}
            onChange={(e) => setSelectedAgentFilter(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-xl py-2.5 px-4 text-xs font-bold text-gray-600 focus:outline-none focus:bg-white focus:border-[#141414] cursor-pointer appearance-none shadow-sm"
          >
            {mockAgentRegistry.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        </div>

        {/* Compliance State Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-xl py-2.5 px-4 text-xs font-bold text-gray-600 focus:outline-none focus:bg-white focus:border-[#141414] cursor-pointer appearance-none shadow-sm"
          >
            <option value="all">All Verification States</option>
            <option value="pending_review">Awaiting Review</option>
            <option value="approved">Approved / Active</option>
            <option value="rejected">Rejected / Flagged</option>
          </select>
        </div>
      </div>

      {/* --- REPOSITORY COMPLIANCE DATA TABLE --- */}
      <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden min-h-[450px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[450px] space-y-4">
            <Loader2 size={28} className="animate-spin text-[#141414]" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Parsing Global MinIO File Trees...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-50/70 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Target Client</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">File Signature</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Uploading Agent</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Compliance Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Registration Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Verification Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDocs.map((doc) => {
                  const targetClient = doc.userId || "Global Registry";
                  const isProcessingItem = actioningId === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors group items-center"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      {/* Client Domain tracking details cell */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#141414] text-white flex items-center justify-center font-black text-[10px] tracking-wider shadow-sm">
                            {targetClient.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 text-xs block">{targetClient}</span>
                            <span className="text-[9px] font-mono text-gray-400 block mt-0.5">DOC-ID: {doc.id.substring(0, 8).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>

                      {/* File Schema Signature Classification info cell */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <FileText size={15} className="text-blue-500 shrink-0" />
                          <span className="capitalize">{doc.type.replace(/_/g, ' ')}</span>
                        </div>
                      </td>

                      {/* Uploading Agent Accountability link identity tracking cell */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                          <User size={13} className="text-gray-400" />
                          <span className="font-bold text-gray-800">{doc.agentName}</span>
                        </div>
                      </td>

                      {/* Global validation state dynamic token status chip wrapper cell */}
                      <td className="px-6 py-4.5">
                        <StatusText status={doc.status} />
                      </td>

                      {/* Log Timestamp extraction mapping formatted string configuration cell */}
                      <td className="px-6 py-4.5 text-xs font-medium text-gray-400 font-mono">
                        {new Date(
                          doc.updatedAt || (doc as any).createdAt || (doc as any).created_at || Date.now()
                        ).toLocaleString('en-GB', { hour12: false })}
                      </td>

                      {/* Fast-path control button overrides block matching cell actions */}
                      <td className="px-6 py-4.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {isProcessingItem ? (
                          <div className="flex justify-end px-4"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedDoc(doc)}
                              title="Audit File View"
                              className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                            >
                              <Eye size={14} />
                            </button>
                            {doc.status !== "approved" && (
                              <button
                                onClick={() => handleUpdateDocumentStatus(doc.id, "approved")}
                                title="Pass Verification"
                                className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-lg transition-colors"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            {doc.status !== "rejected" && (
                              <button
                                onClick={() => handleUpdateDocumentStatus(doc.id, "rejected")}
                                title="Flag & Quarantine File"
                                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                              >
                                <AlertTriangle size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredDocs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-28 text-center">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-3 border border-gray-100 shadow-inner">
                        <FileText size={22} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">No vault assets fit specified profile bounds.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- PORTALS LAYER FOR FULL AUDITING DETAILS VIEWS --- */}
      <AnimatePresence>
        {selectedDoc && (
          <DocumentViewer
            doc={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onUpdateStatus={async (status: any) => {
              await handleUpdateDocumentStatus(selectedDoc.id, status);
              setSelectedDoc(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};