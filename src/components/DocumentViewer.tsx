import React, { useState, useEffect } from "react";
import { 
  X, 
  FileText, 
  Calendar, 
  Maximize2, 
  User as UserIcon, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  Lock, 
  Loader2,
  Sliders,
  EyeOff,
  Link2,
  ExternalLink,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { KycDocument } from "../types"; 

interface DocumentViewerProps {
  doc: KycDocument;
  onClose: () => void;
  onUpdateStatus: (status: KycDocument["status"]) => Promise<void>;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ doc, onClose, onUpdateStatus }) => {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [doc.id, doc.filePath]);

  const handleAction = async (status: KycDocument["status"]) => {
    setUpdating(true);
    try {
      await onUpdateStatus(status);
    } catch (error) {
      console.error("Failed to transition document state", error);
    } finally {
      setUpdating(false);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you absolutely sure you want to permanently delete this document from the vault database and MinIO disk?")) {
      return;
    }

    setDeleting(true);
    try {
      // Pull token from local session storage configuration parameters if matching system workflow structures
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const response = await fetch(`http://localhost:8000/api/v1/vault/documents/${doc.id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        alert("Document successfully erased.");
        onClose();
        window.location.reload();
      } else {
        alert("Error executing backend storage cluster purge operation.");
      }
    } catch (error) {
      console.error("Network system error dispatching delete verb command context:", error);
    } finally {
      setDeleting(false);
    }
  };

  const displayId = doc.userId || "Unassigned"; 

  const chevronBackgroundStyle = {
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 16px center',
    backgroundSize: '12px',
    backgroundRepeat: 'no-repeat'
  };

  const isPassStatus = ["approved", "verified"].includes(doc.status);
  const isFailStatus = doc.status === "rejected";
  const fileUrl = doc.filePath || null;
  const cleanPath = doc.filePath?.split('?')[0] || '';

  const isPdf = /\.pdf$/i.test(cleanPath);
  const isWordOrOffice = /\.(docx|doc|xlsx|xls|pptx|ppt)$/i.test(cleanPath);
  const isImage = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(cleanPath);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#141414]/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 font-sans"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-5xl h-[90vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#141414] text-white p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl text-white">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold capitalize">{doc.type.replace('_', ' ')}</h3>
              <p className="text-xs font-medium text-gray-400 mt-1">
                User: {displayId} • Document ID: {String(doc.id).slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button title="onclose" onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Document Content Area */}
          <div className="flex-1 bg-gray-50 p-8 overflow-y-auto flex items-center justify-center border-r border-gray-100 relative">
            <div className="w-full h-full max-w-2xl aspect-[1/1.4] bg-white shadow-sm border border-gray-100 relative rounded-xl overflow-hidden flex items-center justify-center">
              
              {fileUrl ? (
                isPdf ? (
                  <embed 
                    src={fileUrl} 
                    type="application/pdf" 
                    className="w-full h-full border-0" 
                  />
                ) : isWordOrOffice ? (
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                    className="w-full h-full border-0"
                    title="Office Document Preview"
                  />
                ) : isImage && !imageLoadFailed ? (
                  <img 
                    src={fileUrl} 
                    alt={`${doc.type} Verification File`} 
                    className="w-full h-full object-contain p-4 select-none"
                    onError={() => {
                      console.error("Browser failed to download image asset from server:", fileUrl);
                      setImageLoadFailed(true);
                    }}
                  />
                ) : (
                  <div className="text-center p-6 space-y-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#141414]">
                        {imageLoadFailed ? "Image Load Failed" : "Direct Preview Restricted"}
                      </p>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
                        {imageLoadFailed 
                          ? "The server returned a 404 or CORS error when loading this image file."
                          : "This format requires external application reading software (Word, Excel, Pages)."
                        }
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 max-w-md mx-auto text-left">
                      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Link2 size={10} /> Document URI path:
                      </p>
                      <p className="text-xs font-mono text-gray-600 break-all bg-white p-1.5 border border-gray-200/60 rounded">
                        {fileUrl}
                      </p>
                    </div>

                    <a 
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#141414] hover:bg-black text-white text-xs font-semibold rounded-lg shadow transition-colors"
                    >
                      <ExternalLink size={12} /> Open File in Workspace
                    </a>
                  </div>
                )
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                    <EyeOff size={20} />
                  </div>
                  <p className="text-sm font-semibold text-[#141414]">No Media Connected</p>
                </div>
              )}

              {/* Status Watermark Overlay Layout */}
              {isPassStatus && !imageLoadFailed && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] opacity-15 select-none pointer-events-none">
                  <div className="border-8 border-green-600 rounded-full p-8 flex flex-col items-center bg-white/10 backdrop-blur-[1px]">
                    <ShieldCheck size={120} className="text-green-600" />
                    <span className="text-4xl font-black text-green-600 mt-2 uppercase tracking-widest">
                      {doc.status}
                    </span>
                  </div>
                </div>
              )}
              {isFailStatus && !imageLoadFailed && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] opacity-15 select-none pointer-events-none">
                  <div className="border-8 border-red-600 rounded-full p-8 flex flex-col items-center bg-white/10 backdrop-blur-[1px]">
                    <ShieldAlert size={120} className="text-red-600" />
                    <span className="text-4xl font-black text-red-600 mt-2 uppercase tracking-widest">REJECTED</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="w-full md:w-80 bg-white p-8 flex flex-col overflow-y-auto">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">Metadata</h4>
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Uploaded</p>
                    <p className="text-sm font-bold text-[#141414]">{new Date(doc.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <Maximize2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">File Storage</p>
                    <p className="text-sm font-bold text-[#141414] truncate max-w-[160px]" title={doc.fileName || "Vault Object"}>
                      {doc.fileName || "Standard Native File"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <UserIcon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">User ID</p>
                    <p className="text-sm font-bold text-[#141414]">{displayId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* State & Governance Control Center */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Sliders size={12} /> Document Lifecycle
              </h4>
              <div className="relative">
                <select title="updating"
                  disabled={updating || deleting}
                  value={doc.status}
                  onChange={(e) => handleAction(e.target.value as KycDocument["status"])}
                  style={chevronBackgroundStyle}
                  className="w-full appearance-none cursor-pointer text-xs font-bold uppercase tracking-wider bg-gray-50 hover:bg-gray-100 text-[#141414] border border-gray-100 rounded-xl px-4 pr-10 py-3.5 shadow-sm outline-none focus:outline-none focus:ring-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="pending">Pending Review</option>
                  <option value="verified">Verified</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Instant Macros</h4>
              <div className="space-y-3">
                <button 
                  disabled={updating || deleting || isPassStatus}
                  onClick={() => handleAction("approved")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} 
                  Instant Verify
                </button>
                <button 
                  disabled={updating || deleting || isFailStatus}
                  onClick={() => handleAction("rejected")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />} 
                  Reject Document
                </button>
              </div>
            </div>

            {/* System Destructive Operations Panel */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <button
                disabled={updating || deleting}
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Purge Vault Document
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              {fileUrl && (
                <a 
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={doc.fileName || "downloaded-document"}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Download size={16} /> Download Original File
                </a>
              )}
            </div>
            
            <div className="mt-auto pt-8">
              <div className="bg-gray-50 text-gray-500 p-4 rounded-xl text-xs font-medium flex items-start gap-2">
                <Lock size={14} className="shrink-0 mt-0.5" />
                <p>Encrypted Audit Log: Verified via Vantage Nodes</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};