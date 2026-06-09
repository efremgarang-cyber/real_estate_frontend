import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FileText, 
  ScanText
} from "lucide-react";
import { motion } from "motion/react";
import { KycDocument } from "../types";
import { cn } from "../lib/utils";

interface DocumentViewerProps {
  doc: KycDocument; 
  onClose: () => void;
  onUpdateStatus: (status: "pending_review" | "approved" | "rejected") => Promise<void>;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ doc, onClose, onUpdateStatus }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [secureUrl, setSecureUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Safe fallbacks to prevent undefined crashes
  const docStatus = doc?.status || doc?.verification_status || 'pending_review';
  const docType = doc?.document_type || doc?.type || 'uncategorized';

  useEffect(() => {
    const fetchSecureUrl = async () => {
      const filePath = doc?.s3_private_path;

      if (!filePath) {
        setError("File path is missing from the database.");
        setIsDecrypting(false);
        return;
      }

      try {
        setIsDecrypting(true);
        setError(null);
        
        // Generate a 1-hour secure viewing URL directly from Supabase
        const { data, error: sbError } = await supabase.storage
          .from('user-files')
          .createSignedUrl(filePath, 3600);

        if (sbError) throw sbError;
        if (!data?.signedUrl) throw new Error("Failed to generate secure link.");

        setSecureUrl(data.signedUrl);
      } catch (err: any) {
        console.error("Decryption failed:", err);
        setError(err.message || "Failed to decrypt the file from the vault.");
      } finally {
        setIsDecrypting(false);
      }
    };

    if (doc) {
      fetchSecureUrl();
    }
  }, [doc]);

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

  const isImage = doc?.s3_private_path?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || docType.includes("image");
  const isPdf = doc?.s3_private_path?.match(/\.(pdf)$/i) || docType.includes("pdf");

  // helper to safely handle parsing strings without native crashes
  function json_decode(str: string) {
    try { return JSON.parse(str); } catch (e) { return null; }
  }

  // Helper to render OCR ML Data safely
  const renderOcrData = () => {
    function safeJsonParse(val: any): Record<string, any> | null {
      if (!val) return null;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch { return null; }
    }

    const rawText   = doc?.extracted_text || "";
    const mlData    = safeJsonParse(doc?.ml_data);

    // Has structured ml_data from analyzeKycData()
    if (mlData && Object.keys(mlData).length > 0) {
      return (
        <div className="space-y-1">
          {rawText && (
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl mb-3 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Raw Extracted Text
              </p>
              <p className="text-xs font-mono text-gray-600 whitespace-pre-wrap leading-relaxed">
                {rawText}
              </p>
            </div>
          )}
          {Object.entries(mlData).map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0"
            >
              <span className="text-xs font-medium text-gray-500 capitalize mt-0.5">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-bold text-[#141414] text-right max-w-[60%] break-words">
                {typeof value === 'boolean'
                  ? (value ? 'Yes' : 'No')
                  : String(value ?? 'N/A')}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Has raw text only, no structured analysis
    if (rawText) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl max-h-64 overflow-y-auto">
          <p className="text-xs font-mono text-gray-600 whitespace-pre-wrap leading-relaxed">
            {rawText}
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
        <p className="text-xs font-medium text-gray-400">
          No OCR data available for this document.
        </p>
      </div>
    );
  };


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
          <div className="flex items-center gap-4 bg-[#323639] px-4 py-3 shrink-0 shadow-sm z-10">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {docType.replace(/_/g, ' ')}
            </span>
            
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              docStatus === "verified" ? "text-green-500" : "text-orange-500",
              docStatus === 'rejected' ? "text-red-500" : "text-orange-500"
            )}>
              {docStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
            {secureUrl ? (
              isImage ? (
                <img 
                  src={secureUrl} 
                  alt="KYC Document" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              ) : isPdf ? (
                <iframe 
                  src={`${secureUrl}#toolbar=0`} 
                  className="w-full h-full rounded-lg bg-white"
                  title="PDF Viewer"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <FileText size={48} className="mb-2" />
                  <p className="text-sm font-medium">Preview not available for this file type.</p>
                  <a href={secureUrl} target="_blank" rel="noreferrer" className="mt-4 text-xs font-bold text-[#141414] hover:underline">Download to view</a>
                </div>
              )
            ) : error ? (
              <div className="flex flex-col items-center gap-3 text-red-500 p-6 text-center">
                <XCircle size={40} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 size={32} className="animate-spin text-[#141414]" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#141414]">Decrypting file...</p>
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
                  <span className="text-sm font-bold text-[#141414]">{doc?.documentable_id || doc?.userId || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-500">Uploaded On</span>
                  <span className="text-sm font-bold text-[#141414]">
                    {doc?.created_at || doc?.updated_at ? new Date(doc.created_at || doc.updated_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* OCR Data Area */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ScanText size={16} className="text-gray-400" />
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OCR Extraction Data</h4>
              </div>
              
              {renderOcrData()}
            </div>

            {/* Agent Notes */}
            {doc?.notes && (
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Agent Notes</h4>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <p className="text-sm text-gray-700 leading-relaxed">{doc.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            {docStatus === 'pending_review' ? (
              <div className="flex gap-3">
                <button 
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={isProcessing || isDecrypting}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Reject
                </button>
                <button 
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={isProcessing || isDecrypting}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#141414] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors shadow-sm disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Approve
                </button>
              </div>
            ) : (
              <div className="w-full py-3.5 bg-gray-200 text-gray-500 rounded-xl text-xs font-bold uppercase tracking-wider text-center cursor-not-allowed">
                Document {docStatus.replace('_', ' ')}
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
};