import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Search,
  Plus,
  Loader2
} from "lucide-react";
import { AnimatePresence } from "framer-motion"; // Unified framework import boundary
import { useAuth } from "../../lib/AuthContext";
import { StatusText } from "../../components/StatusText";
import { DocumentUploadModal } from "../../components/DocumentUploadModal";
import { DocumentViewer } from "../../components/DocumentViewer"; 
import { api } from "../../lib/api"; 
import { vaultApi } from "../../api/vault"; 
import { KycDocument } from "../../types";

export const VaultPage: React.FC = () => {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<KycDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Unified State Hooks for UI Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Synchronized filter requests with active state tracking
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await vaultApi.getDocuments({
          search: searchTerm,
          category: category,
          status: status,
          date_range: dateRange,
        });
        
        setDocs(response.data || []);
      } catch (error) {
        console.error("Failed to load vault documents", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchDocuments();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, category, status, dateRange]);

  const handleDocumentSave = async (metadata: any) => {
    try {
      const response = await api.post('/vault/documents', metadata);
      setDocs(prev => [response.data.data, ...prev]);
      setShowUploadModal(false);
    } catch (error) {
      console.error("Failed to save document metadata", error);
      alert("Document uploaded, but failed to sync database record.");
    }
  };

  // Adjusted param to string | number to natively accommodate integer IDs
  const handleUpdateDocumentStatus = async (documentId: string | number, nextStatus: KycDocument["status"]) => {
    try {
      // 1. Submit patch payload upstream to Laravel backend pipeline
      await api.patch(`/v1/vault/documents/${documentId}/status`, { status: nextStatus });
      
      // 2. Map current state collection explicitly to reflect status instantly in real-time
      setDocs(prevDocs => 
        prevDocs.map(d => d.id === documentId ? { ...d, status: nextStatus } : d)
      );
    } catch (error) {
      console.error("Critical: Failed database patch lifecycle synchronization loop", error);
      alert("System failed to commit status update changes downstream.");
    }
  };

  const premiumDropdownClass = `
    appearance-none cursor-pointer text-sm font-medium text-gray-700 bg-white 
    border border-gray-200 hover:border-gray-300 rounded-xl px-4 pr-10 py-3 
    shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] 
    transition-all duration-200 outline-none focus:outline-none focus:ring-0
  `.trim();

  const chevronBackgroundStyle = {
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 12px center',
    backgroundSize: '14px',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Search and Dropdowns Top Filter Panel */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by client ID, type or status..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-300 transition-all text-sm shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown Selector */}
          <div className="relative">
            <select title="category"
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className={premiumDropdownClass}
              style={chevronBackgroundStyle}
            >
              <option value="all">All Categories</option>
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="title_deed">Title Deed</option>
              <option value="utility_bill">Utility Bill</option>
            </select>
          </div>

          {/* Status Dropdown Selector */}
          <div className="relative">
            <select title="status"
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className={premiumDropdownClass}
              style={chevronBackgroundStyle}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          {/* Date Range Dropdown Selector */}
          <div className="relative">
            <select title="datarange"
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className={premiumDropdownClass}
              style={chevronBackgroundStyle}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white px-5 py-3 rounded-xl font-medium transition-all duration-200 text-sm shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transform active:scale-[0.98] ml-auto xl:ml-0"
          >
            <Plus size={16} /> New Document
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
            <Loader2 size={32} className="animate-spin text-[#141414]" />
            <p className="text-sm font-medium text-gray-500">Decrypting vault metadata...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Client ID</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Document Type</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Upload Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {docs.map((doc) => {
                const displayId = doc.userId || "Unassigned";
                return (
                  <tr 
                    key={doc.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[#141414] font-bold text-xs group-hover:bg-gray-200 transition-colors">
                          {/* Force cast displayId to string before slicing to safely handle pure integer numbers */}
                          {String(displayId).slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-[#141414]">{displayId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400" />
                        <span className="capitalize">{doc.type?.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusText status={doc.status || 'pending'} />
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-500">
                      {new Date(doc.updated_at as string).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Stops parent row bubbling instantly
                          setSelectedDoc(doc);
                        }}
                        className="text-gray-400 group-hover:text-[#141414] hover:underline transition-colors font-semibold"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
                       <FileText size={24} />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No documents found matching criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Metrics Layout Track Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">S3 Storage Utilization</h4>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
            <div className="bg-[#141414] h-full w-[65%] rounded-full" />
          </div>
          <p className="text-sm font-medium text-gray-500">65GB / 100GB Allocated</p>
        </div>
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <h4 className="font-display text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Verification Velocity</h4>
          <p className="text-3xl font-bold text-[#141414]">2.4h</p>
          <p className="text-sm font-medium text-gray-500 mt-2">Avg extraction performance per document</p>
        </div>
      </div>

      {/* Modals Container Layout */}
      <AnimatePresence mode="wait">
        {selectedDoc && (
          <DocumentViewer 
            doc={selectedDoc} 
            onClose={() => setSelectedDoc(null)} 
            onUpdateStatus={(status) => handleUpdateDocumentStatus(selectedDoc.id, status)}
          />
        )}
        {showUploadModal && (
          <DocumentUploadModal 
            onClose={() => setShowUploadModal(false)} 
            onSuccess={handleDocumentSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};