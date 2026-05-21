import React, { useState, useEffect } from "react";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search,
  Filter,
  Download,
  Eye,
  Lock,
  X,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User as UserIcon,
  Maximize2,
  Plus,
  ArrowRight,
  Loader2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useDropzone } from "react-dropzone";
import { kycService } from "../../services/kycService";
import { useAuth } from "../../lib/AuthContext";
import { KycDocument } from "../../types";

export const VaultPage: React.FC = () => {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<KycDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KycDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.agencyId) return;

    const unsubscribe = kycService.subscribeToAgencyKyc(profile.agencyId, (updatedDocs) => {
      setDocs(updatedDocs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.agencyId]);

  const filteredDocs = docs.filter(doc => 
    doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.clientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-[#141414] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by client ID or document type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none pl-10 pr-4 py-2 text-sm focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus size={14} /> New Document
          </button>
          <button className="btn-secondary flex items-center gap-2 text-xs">
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      <div className="dashboard-card overflow-hidden p-0 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-[#141414]">
              <tr>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-gray-500 italic">Client ID</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-gray-500 italic">Document Type</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-gray-500 italic">Status</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-gray-500 italic">Upload Date</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase text-gray-500 italic text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.map((doc) => (
                <tr 
                  key={doc.id} 
                  className="hover:bg-[#141414] hover:text-[#E4E3E0] group cursor-pointer transition-colors"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#141414] group-hover:bg-[#E4E3E0] transition-colors font-mono text-[10px]">
                        {doc.clientId.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold">{doc.clientId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400 group-hover:text-white" />
                      <span>{doc.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <StatusBadge status={doc.status} />
                      {doc.status === "Pending" && (
                        <span className="text-[8px] font-mono uppercase italic text-blue-500 mt-1 animate-pulse">Running AI OCR Extraction...</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-mono opacity-60 uppercase italic">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-white/20 transition-colors rounded">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 hover:bg-white/20 transition-colors rounded">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <p className="text-xs font-mono uppercase italic text-gray-400">No documents found in vault.</p>
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
            doc={selectedDoc} 
            onClose={() => setSelectedDoc(null)} 
            onUpdateStatus={(status) => kycService.updateStatus(selectedDoc.id, profile!.agencyId, status)}
          />
        )}
        {showUploadModal && (
          <DocumentUploadModal 
            onClose={() => setShowUploadModal(false)} 
            onUpload={async (data) => {
              await kycService.addDocument({
                agencyId: profile!.agencyId,
                status: "Pending",
                fileUrl: "vantage://s3-encrypted/docs/" + Math.random().toString(36).substring(7),
                ...data
              });
              setShowUploadModal(false);
            }}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dashboard-card border-dashed">
          <h4 className="font-bold uppercase text-xs mb-4 italic">Storage Utilization</h4>
          <div className="w-full bg-gray-100 h-2 border border-[#141414]">
            <div className="bg-[#141414] h-full w-[65%]" />
          </div>
          <p className="text-[10px] font-mono text-gray-500 mt-2 uppercase italic">65GB / 100GB (Private S3 Vault)</p>
        </div>
        <div className="dashboard-card border-dashed">
          <h4 className="font-bold uppercase text-xs mb-4 italic">Verification Velocity</h4>
          <p className="text-3xl font-black">2.4h</p>
          <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase italic">Avg performance per document</p>
        </div>
      </div>
    </div>
  );
};

const DocumentUploadModal = ({ onClose, onUpload }: { onClose: () => void, onUpload: (data: any) => Promise<void> }) => {
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState("");
  const [clientId, setClientId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: files => setAcceptedFiles(files),
    multiple: false,
    noClick: true // We'll use a custom button for click
  });

  const types = ["National ID", "Passport", "KRA PIN Certificate", "Business Permit"];

  const handleUpload = async () => {
    if (!docType || !clientId || acceptedFiles.length === 0) return;
    setUploading(true);
    await onUpload({ 
      type: docType, 
      clientId,
      fileName: acceptedFiles[0].name,
      fileSize: `${(acceptedFiles[0].size / (1024 * 1024)).toFixed(2)} MB`
    });
    setUploading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#141414]/90 flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="dashboard-card bg-white max-w-md w-full p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black uppercase italic">New KYC Deposit</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <p className="text-xs font-mono text-gray-500 uppercase italic">Step 1: Select Document Category</p>
            <div className="grid grid-cols-1 gap-3">
              {types.map(t => (
                <button 
                  key={t}
                  onClick={() => setDocType(t)}
                  className={cn(
                    "p-4 border border-[#141414] text-left uppercase italic font-bold text-sm transition-all flex items-center justify-between",
                    docType === t ? "bg-[#141414] text-white" : "bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  {t}
                  <ArrowRight size={16} className={docType === t ? "opacity-100" : "opacity-0"} />
                </button>
              ))}
            </div>
            <button 
              disabled={!docType}
              onClick={() => setStep(2)}
              className="btn-primary w-full py-4 mt-4 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs font-mono text-gray-500 uppercase italic">Step 2: Client & File Association</p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase italic mb-1">Client Identifier (Name or ID)</label>
                <input 
                  type="text" 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. CLI-8829"
                  className="input-field uppercase italic text-sm font-bold"
                />
              </div>
              
              <div 
                {...getRootProps()}
                className={cn(
                  "p-12 border-2 border-dashed transition-all text-center space-y-4 cursor-default",
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-[#141414]/20 bg-gray-50",
                  acceptedFiles.length > 0 && "border-green-500 bg-green-50"
                )}
              >
                <input {...getInputProps()} />
                
                {acceptedFiles.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-green-100 rounded-full text-green-600 mb-2">
                       <CheckCircle size={24} />
                    </div>
                    <p className="text-[10px] font-bold uppercase italic text-green-600 truncate max-w-[200px]">{acceptedFiles[0].name}</p>
                    <p className="text-[8px] font-mono uppercase text-gray-400">{(acceptedFiles[0].size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <>
                    <FileText size={32} className="mx-auto text-gray-300" />
                    <p className="text-[10px] font-mono uppercase italic text-gray-400">
                      {isDragActive ? "Drop documentation here" : "Drag and drop document scan here (PDF, JPG)"}
                    </p>
                  </>
                )}
                
                <button 
                  type="button"
                  onClick={open}
                  className="text-[10px] font-bold underline uppercase italic hover:text-gray-600"
                >
                  {acceptedFiles.length > 0 ? "Change File" : "Browse Files"}
                </button>
              </div>

              {uploading && (
                <div className="space-y-1">
                   <div className="flex justify-between text-[8px] font-mono uppercase italic text-blue-500">
                      <span>Uploading to S3...</span>
                      <span>98%</span>
                   </div>
                   <div className="w-full bg-gray-100 h-1 border border-[#141414]/10">
                      <div className="bg-blue-500 h-full w-[98%] animate-pulse" />
                   </div>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-4">Back</button>
              <button 
                onClick={handleUpload}
                disabled={!clientId || uploading || acceptedFiles.length === 0}
                className="btn-primary flex-[2] py-4 flex items-center justify-center gap-2"
              >
                {uploading && <Loader2 size={16} className="animate-spin" />}
                {uploading ? "Depositing..." : "Deposit to Vault"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const DocumentViewer = ({ doc, onClose, onUpdateStatus }: { doc: KycDocument, onClose: () => void, onUpdateStatus: (status: KycDocument["status"]) => Promise<void> }) => {
  const [updating, setUpdating] = useState(false);

  const handleAction = async (status: KycDocument["status"]) => {
    setUpdating(true);
    await onUpdateStatus(status);
    setUpdating(false);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#141414]/95 flex items-center justify-center p-4 md:p-12"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-5xl h-full bg-[#E4E3E0] border border-[#141414] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#141414] text-[#E4E3E0] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white text-[#141414]">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tight">{doc.type}</h3>
              <p className="text-[10px] font-mono uppercase opacity-60">Client: {doc.clientId} • Document ID: {doc.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Document Content */}
          <div className="flex-1 bg-gray-200 p-8 overflow-y-auto flex items-center justify-center">
            <div className="w-full max-w-2xl aspect-[1/1.4] bg-white shadow-2xl border border-gray-300 p-12 relative">
              {/* Mock Document Content */}
              <div className="absolute top-8 right-8 text-[10px] font-mono uppercase text-gray-300">Confidential</div>
              <div className="w-20 h-4 bg-gray-100 mb-12" />
              <h4 className="text-2xl font-serif mb-8 border-b-2 border-gray-100 pb-4">{doc.type}</h4>
              
              <div className="space-y-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-50 w-full" />
                    <div className="h-4 bg-gray-50 w-5/6" />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-20 left-12 right-12 flex justify-between items-end">
                <div className="w-32 border-t border-gray-300 pt-2 text-[8px] font-mono uppercase">Agent Signature</div>
                <div className="w-32 border-t border-gray-300 pt-2 text-[8px] font-mono uppercase">LRC Verification Seal</div>
              </div>
              
              {/* Status Overlay */}
              {doc.status === "Verified" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] opacity-20 select-none pointer-events-none">
                  <div className="border-8 border-green-600 rounded-full p-8 flex flex-col items-center">
                    <ShieldCheck size={120} className="text-green-600" />
                    <span className="text-4xl font-black text-green-600 mt-2 uppercase">VERIFIED</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="w-full md:w-80 bg-white border-l border-[#141414] p-8 space-y-8">
            <div>
              <h4 className="text-xs font-black uppercase italic mb-4 text-gray-400">Metadata</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-[10px] font-mono uppercase font-bold">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Maximize2 size={14} className="text-gray-400" />
                  <span className="text-[10px] font-mono uppercase font-bold">1.2 MB</span>
                </div>
                <div className="flex items-center gap-3">
                  <UserIcon size={14} className="text-gray-400" />
                  <span className="text-[10px] font-mono uppercase font-bold">{doc.clientId}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-gray-100">
              <h4 className="text-xs font-black uppercase italic mb-4">Verification Actions</h4>
              <button 
                disabled={updating || doc.status === "Verified"}
                onClick={() => handleAction("Verified")}
                className="w-full btn-primary bg-green-600 border-green-700 hover:bg-green-700 hover:shadow-none flex items-center justify-center gap-2 py-3 text-xs disabled:opacity-50"
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} 
                Approve & Verify
              </button>
              <button 
                disabled={updating || doc.status === "Rejected"}
                onClick={() => handleAction("Rejected")}
                className="w-full btn-secondary text-red-600 hover:text-red-700 flex items-center justify-center gap-2 py-3 text-xs disabled:opacity-50"
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />} 
                Reject Document
              </button>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <button className="w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase italic underline hover:text-gray-600">
                <Download size={14} /> Download Original PDF
              </button>
            </div>
            
            <div className="mt-auto bg-[#141414] text-[#E4E3E0] p-4 text-[9px] font-mono uppercase italic border border-[#141414]">
              <Lock size={12} className="inline mr-2 mb-1" />
              Encrypted Audit Log: Verified by Vantage OS 2.0 Node #882
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    "Verified": "bg-green-100 text-green-700 border-green-200",
    "Under Review": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Pending": "bg-gray-100 text-gray-600 border-gray-200",
    "Rejected": "bg-red-100 text-red-700 border-red-200",
  };

  const Icons: any = {
    "Verified": CheckCircle,
    "Under Review": Clock,
    "Pending": Clock,
    "Rejected": XCircle,
  };

  const Icon = Icons[status];

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase italic border",
      styles[status]
    )}>
      <Icon size={10} />
      {status}
    </span>
  );
};
