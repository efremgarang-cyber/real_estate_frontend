import React, { useState } from "react";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FileText, 
  ShieldCheck, 
  BrainCircuit,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface DocumentViewerProps {
  doc: any; // Requires the Document object with a valid .signedUrl attached
  onClose: () => void;
  onUpdateStatus: (status: "pending_review" | "approved" | "rejected") => Promise<void>;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ doc, onClose, onUpdateStatus }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusUpdate = async (status: "approved" | "rejected") => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(status);
      // Parent modal handles closing on success
    } catch (error) {
      console.error("Failed to update status");
      setIsProcessing(false);
    }
  };

  const isImage = doc.s3_path?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || doc.type?.includes("image");
  const isPdf = doc.s3_path?.match(/\.(pdf)$/i) || doc.type?.includes("pdf");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => !isProcessing && onClose()}
        className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
      />

      {/* Modal Content - Wide layout for side-by-side review */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]"
      >
        
        {/* Left Side: Document Visualizer */}
        <div className="flex-1 bg-gray-100 relative flex flex-col border-r border-gray-200">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
              {doc.type.replace(/_/g, ' ')}
            </span>
            <span className={cn(
              "px-3 py-1.5 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-white",
              doc.status === 'approved' ? "bg-green-600/80" : 
              doc.status === 'rejected' ? "bg-red-600/80" : "bg-orange-500/80"
            )}>
              {doc.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
            {doc.signedUrl ? (
              isImage ? (
                <img 
                  src={doc.signedUrl} 
                  alt="KYC Document" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              ) : isPdf ? (
                <iframe 
                  src={`${doc.signedUrl}#toolbar=0`} 
                  className="w-full h-full rounded-lg bg-white"
                  title="PDF Viewer"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <FileText size={48} className="mb-2" />
                  <p className="text-sm font-medium">Preview not available for this file type.</p>
                  <a href={doc.signedUrl} target="_blank" rel="noreferrer" className="mt-4 text-xs font-bold text-[#141414] underline">Download to view</a>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 size={32} className="animate-spin text-[#141414]" />
                <p className="text-xs font-bold uppercase tracking-wider">Decrypting file...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: ML Kit Details & Action Panel */}
        <div className="w-full md:w-[400px] flex flex-col bg-white shrink-0">
          
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="font-display text-lg font-bold text-[#141414]">Verification Queue</h3>
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-[#141414] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Meta Data */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Asset Metadata</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-500">Client ID</span>
                  <span className="text-sm font-bold text-[#141414]">{doc.userId || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-500">Uploaded On</span>
                  <span className="text-sm font-bold text-[#141414]">{new Date(doc.created_at || doc.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Google ML Kit Mock Data Area (To be replaced by actual DB data later) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit size={16} className="text-purple-600" />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ML Kit Extraction Data</h4>
              </div>
              
              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 space-y-3">
                {doc.status === 'pending_review' ? (
                  <>
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-800">
                      <ShieldCheck size={14} className="text-green-600" /> Document boundaries detected
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-purple-800">
                      <ShieldCheck size={14} className="text-green-600" /> Text clarity sufficient for OCR
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-orange-700 mt-2 pt-2 border-t border-purple-100">
                      <AlertTriangle size={14} className="text-orange-600" /> Requires manual confirmation of ID number
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500 italic">Extraction data locked post-review.</p>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            {doc.notes && (
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Agent Notes</h4>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700 leading-relaxed">{doc.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            {doc.status === 'pending_review' ? (
              <div className="flex gap-3">
                <button 
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Reject
                </button>
                <button 
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#141414] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Approve
                </button>
              </div>
            ) : (
              <div className="w-full py-3.5 bg-gray-200 text-gray-500 rounded-xl text-xs font-bold uppercase tracking-wider text-center cursor-not-allowed">
                Document {doc.status.replace('_', ' ')}
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};