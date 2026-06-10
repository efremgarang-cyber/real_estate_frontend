import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FileText, 
  ScanText,
  AlertCircle,
  Check,
  Info
} from "lucide-react";
import { motion } from "motion/react";
import { KycDocument } from "../types";
import { cn } from "../lib/utils";

interface ToastNotification { 
  id: string; 
  type: 'success' | 'error' | 'info' | 'warning'; 
  title: string; 
  message: string; 
}

const Toast: React.FC<{ notification: ToastNotification; onClose: () => void }> = ({ notification, onClose }) => {
  React.useEffect(() => { 
    const timer = setTimeout(() => { onClose(); }, 5000); 
    return () => clearTimeout(timer); 
  }, [onClose]);

  const icons = { 
    success: <Check className="w-5 h-5 text-green-600" />, 
    error: <AlertCircle className="w-5 h-5 text-red-600" />, 
    warning: <AlertCircle className="w-5 h-5 text-orange-600" />, 
    info: <Info className="w-5 h-5 text-blue-600" /> 
  };
  
  const colors = { 
    success: "bg-green-50 border-green-200", 
    error: "bg-red-50 border-red-200", 
    warning: "bg-orange-50 border-orange-200", 
    info: "bg-blue-50 border-blue-200" 
  };

  return (
    <div className={`w-96 rounded-xl border shadow-lg ${colors[notification.type]} animate-in slide-in-from-top-2 duration-300`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{icons[notification.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
            <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
          </div>
          <button title="Close notification" onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface DocumentViewerProps {
  doc: KycDocument; 
  onClose: () => void;
  onUpdateStatus: (status: "pending_review" | "verified" | "rejected") => Promise<void>;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ doc, onClose, onUpdateStatus }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [secureUrl, setSecureUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Safe fallbacks to prevent undefined crashes
  const docStatus = doc?.status || doc?.verification_status || 'pending_review';
  const docType = doc?.document_type || doc?.type || 'uncategorized';

  const addNotification = (type: ToastNotification['type'], title: string, message: string) => {
    const notifId = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id: notifId, type, title, message }]);
  };

  const removeNotification = (notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  useEffect(() => {
    const fetchSecureUrl = async () => {
      const filePath = doc?.s3_private_path;

      if (!filePath) {
        setError("File path is missing from the database.");
        addNotification('error', 'Missing File', 'No file path found in the database record.');
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
        addNotification('success', 'Decryption Successful', 'Secure link generated for viewing.');
      } catch (err: any) {
        console.error("Decryption failed:", err.response.data);
        const errorMsg = err.response.data.message || "Failed to decrypt the file from the vault.";
        setError(errorMsg);
        addNotification('error', 'Decryption Failed', errorMsg);
      } finally {
        setIsDecrypting(false);
      }
    };

    if (doc) {
      fetchSecureUrl();
    }
  }, [doc]);

  const handleStatusUpdate = async (status: "verified" | "rejected") => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(status);
      addNotification('success', 'Status Updated', `Document successfully marked as ${status}.`);
      // Optional: Add a slight delay before closing if you want the user to see the success toast
      setTimeout(() => {
         // Parent modal usually handles closing on success if it invalidates the query
      }, 1000);
    } catch (error: any) {
      console.error("Failed to update status", error.response.data);
      addNotification('error', 'Update Failed', error.response.data.message || 'Could not update the document status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isImage = doc?.s3_private_path?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || docType.includes("image");
  const isPdf = doc?.s3_private_path?.match(/\.(pdf)$/i) || docType.includes("pdf");

  // helper to safely handle parsing strings without native crashes
  function json_decode(str: string) {
    try { return JSON.parse(str); } catch (e) { return null; }
  }

  // Helper to render OCR ML Data safely and extract KRA specifics
  const renderOcrData = () => {
    function safeJsonParse(val: any): Record<string, any> | null {
      if (!val) return null;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch { return null; }
    }

    const rawText = doc?.extracted_text || "";
    const mlData = safeJsonParse(doc?.ml_data);

    // Fallback parser: Attempts to pull structured data from raw KRA certificate OCR
    const parseKraData = (text: string) => {
      if (!text) return null;
      
      const extract = (regex: RegExp) => text.match(regex)?.[1]?.trim() || "N/A";
      
      return {
        pin: text.match(/[A-Z]\d{9}[A-Z]/)?.[0] || "N/A",
        email: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "N/A",
        name: extract(/Taxpayer Name\s*\n([^\n]+)/i) || extract(/Taxpayer Information\s*\n([^\n]+)/i),
        building: extract(/Building\s*:\s*([^\n]+)/i),
        street: extract(/Street\/Road\s*:\s*([^\n]+)/i),
        city: extract(/City\/Town\s*:\s*([^\n]+)/i),
        county: extract(/County\s*:\s*([^\n]+)/i),
        station: extract(/Station\s*:\s*([^\n]+)/i)
      };
    };

    const parsedData = parseKraData(rawText);
    console.log(parsedData);
    const hasParsedData = parsedData && (parsedData.pin !== "N/A" || parsedData.name !== "N/A");
    const hasMlData = mlData && Object.keys(mlData).length > 0;

    if (!rawText && !hasMlData) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
          <p className="text-xs font-medium text-gray-400">
            No OCR or Verification data available for this document.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        
        {/* 1. Official ML Verification Data (Restored) */}
        {hasMlData && (
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-2">
              System Verification Data
            </h5>
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
              {Object.entries(mlData).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-start py-2 border-b border-gray-200/60 last:border-0"
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
          </div>
        )}

        {/* 2. Extracted KRA Structured Data */}
        {hasParsedData && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-2">
                Taxpayer Identity
              </h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</span>
                  <span className="text-sm font-bold text-[#141414]">{parsedData.name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">KRA PIN</span>
                  <span className="text-sm font-bold text-[#141414]">{parsedData.pin}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
                  <span className="text-sm font-bold text-[#141414]">{parsedData.email}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mb-2">
                Registered Address
              </h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Building / Plaza</span>
                  <span className="text-sm font-bold text-[#141414]">{parsedData.building}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Street / Road</span>
                  <span className="text-sm font-bold text-[#141414]">{parsedData.street}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">City / Town</span>
                  <span className="text-sm font-bold text-[#141414]">{parsedData.city}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">County</span>
                  <span className="text-sm font-bold text-[#141414]">{parsedData.county}</span>
                </div>
                <div className="col-span-2 border-t border-gray-200 pt-2 mt-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tax Station</span>
                  <span className="text-sm font-bold text-[#141414]">{parsedData.station}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Collapsible Raw Text Fallback */}
        {rawText && (
          <details className="group">
            <summary className="text-[10px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-[#141414] transition-colors flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-gray-100 flex items-center justify-center group-open:rotate-90 transition-transform">
                ›
              </span>
              View Raw OCR Transcript
            </summary>
            <div className="mt-3 p-4 bg-gray-50 border border-gray-100 rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
              <p className="text-xs font-mono text-gray-600 whitespace-pre-wrap leading-relaxed">
                {rawText}
              </p>
            </div>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[150] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto">
            <Toast notification={n} onClose={() => removeNotification(n.id)} />
          </div>
        ))}
      </div>

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
                  onClick={() => handleStatusUpdate('verified')}
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