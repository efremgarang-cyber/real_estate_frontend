import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Search,
  Filter,
  Plus,
  Loader2
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useAuth } from "../../../lib/AuthContext";
import { StatusText } from "../../../components/StatusText";
import { DocumentUploadModal } from "../../../components/DocumentUploadModal";
import { DocumentViewer } from "../../../components/DocumentViewer";
import { api } from "../../../lib/api";
import { vaultApi } from "../../../api/vault";
import { KycDocument } from "../../../types";

// Extended interface to handle the temporary signed URL for the UI
interface SecureKycDocument extends KycDocument {
  signedUrl?: string;
}

export const VaultPage: React.FC = () => {
  const { profile } = useAuth();
  const [docs, setDocs]               = useState<SecureKycDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<SecureKycDocument | null>(null);
  const [searchTerm, setSearchTerm]   = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vault/documents');
      const data = response.data?.data || response.data || [];
      
      // Batch sign all secure document URLs from the database
      const signedDocs = await Promise.all(
        data.map(async (doc: any) => {
          const rawUrl = doc.s3_path || doc.url || doc.file_path;
          const signedUrl = rawUrl ? await vaultApi.getSignedUrl(rawUrl) : undefined;
          return { ...doc, signedUrl };
        })
      );

      setDocs(signedDocs);
    } catch (error) {
      console.error("Failed to load vault documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const filteredDocs = docs.filter(doc =>
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.userId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDocumentSave = async (payload: {
    file: File;
    type: string;
    userId?: string;
    notes?: string;
  }) => {
    setUploadError(null);
    try {
      let secureDocType: 'kyc' | 'title_deed' | 'property_image' = 'kyc';
      if (payload.type === 'title_deed') {
        secureDocType = 'title_deed';
      } else if (payload.type === 'property_image') {
        secureDocType = 'property_image';
      }

      // Step 1: Upload to secure Supabase bucket
      const supabaseUrl = await vaultApi.executeSecureUpload(
        payload.file,
        secureDocType
      );

      // Step 2: Persist in the database (ensure endpoint matches your Laravel route)
      const response = await api.post('/vault/documents', {
        s3_path:  supabaseUrl,
        type:     payload.type,
        user_id:  payload.userId  ?? null,
        notes:    payload.notes   ?? null,
        status:   'pending_review',
      });

      const newDoc = response.data?.data || response.data;
      
      // Step 3: Immediately sign the new URL so it can be viewed without refreshing
      const signedUrl = await vaultApi.getSignedUrl(supabaseUrl);

      setDocs(prev => [{ ...newDoc, signedUrl }, ...prev]);
      setShowUploadModal(false);
    } catch (error: any) {
      console.error("Document upload failed:", error);
      setUploadError(
        error?.response?.data?.message ||
        error?.message ||
        "Upload failed. Please try again."
      );
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by client ID or document type..."
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
            onClick={() => { setShowUploadModal(true); setUploadError(null); }}
            className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white px-5 py-3 rounded-xl font-medium transition-colors text-sm shadow-sm"
          >
            <Plus size={16} /> New Document
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-600">
          {uploadError}
        </div>
      )}

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
                        <span className="capitalize">{doc.type.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusText status={doc.status} />
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-500">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}
                        className="text-xs font-semibold text-gray-400 hover:text-[#141414] transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}

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

      <AnimatePresence>
        {selectedDoc && (
          <DocumentViewer
            doc={selectedDoc} // `selectedDoc.signedUrl` will now be passed automatically to your viewer
            onClose={() => setSelectedDoc(null)}
            onUpdateStatus={async (status: any) => {
              await api.patch(`/v1/vault/documents/${selectedDoc.id}/status`, { status });
              setDocs(docs.map(d => d.id === selectedDoc.id ? { ...d, status } : d));
              setSelectedDoc(null);
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