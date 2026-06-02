import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  Loader2
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useAuth } from "../../lib/AuthContext";
// Assuming you created these in the same directory or separate files
import { StatusText } from "../../components/StatusText";
import { DocumentUploadModal } from "../../components/DocumentUploadModal";
import { DocumentViewer } from "../../components/DocumentViewer"; // Abstracted for brevity
import { api } from "../../lib/api"; 
import { KycDocument } from "../../types";

export const VaultPage: React.FC = () => {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<KycDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch documents from database (metadata pointing to S3)
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        // Replace with your actual document fetch API endpoint
        const response = await api.get<{ data: KycDocument[] }>('/v1/vault/documents');
        setDocs(response.data.data || []);
      } catch (error) {
        console.error("Failed to load vault documents", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const filteredDocs = docs.filter(doc => 
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.userId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDocumentSave = async (metadata: any) => {
    // Save the S3 metadata to your Laravel database
    try {
      const response = await api.post('/v1/vault/documents', metadata);
      setDocs(prev => [response.data.data, ...prev]);
      setShowUploadModal(false);
    } catch (error) {
      console.error("Failed to save document metadata", error);
      alert("Document uploaded, but failed to sync database record.");
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by client ID or type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white px-5 py-3 rounded-xl font-medium transition-colors text-sm shadow-sm"
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
              {filteredDocs.map((doc) => {
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
                        {displayId.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-[#141414]">{displayId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <StatusText status={doc.status} />
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-gray-500">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </td>
                  {/* Actions column remains the same */}
                </tr>
              )})}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
                       <FileText size={24} />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No documents found in secure vault.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

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

      <AnimatePresence>
        {selectedDoc && (
          <DocumentViewer 
            doc={selectedDoc} 
            onClose={() => setSelectedDoc(null)} 
            onUpdateStatus={async (status: any) => {
               await api.patch(`/v1/vault/documents/${selectedDoc.id}/status`, { status });
               setDocs(docs.map(d => d.id === selectedDoc.id ? { ...d, status } : d));
            }}
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