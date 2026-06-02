import React, { useState } from "react";
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
  Loader2 
} from "lucide-react";
import { motion } from "motion/react";
import { KycDocument } from "../types"; // Adjust this import path to match your structure

interface DocumentViewerProps {
  doc: KycDocument;
  onClose: () => void;
  onUpdateStatus: (status: KycDocument["status"]) => Promise<void>;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ doc, onClose, onUpdateStatus }) => {
  const [updating, setUpdating] = useState(false);

  const handleAction = async (status: KycDocument["status"]) => {
    setUpdating(true);
    await onUpdateStatus(status);
    setUpdating(false);
    onClose();
  };

  // Safe fallback if userId is undefined
  const displayId = doc.userId || "Unassigned"; 

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
              <p className="text-xs font-medium text-gray-400 mt-1">User: {displayId} • Document ID: {doc.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button title="onclose" onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Document Content Area (Mock layout) */}
          <div className="flex-1 bg-gray-50 p-8 overflow-y-auto flex items-center justify-center border-r border-gray-100 relative">
            <div className="w-full max-w-2xl aspect-[1/1.4] bg-white shadow-sm border border-gray-200 p-12 relative rounded-xl">
              <div className="absolute top-8 right-8 text-xs font-semibold uppercase tracking-wider text-gray-300">Confidential</div>
              <div className="w-20 h-4 bg-gray-100 rounded-full mb-12" />
              <h4 className="text-2xl font-bold text-[#141414] mb-8 border-b border-gray-100 pb-4 capitalize">{doc.type.replace('_', ' ')}</h4>
              
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="h-3 bg-gray-50 rounded-full w-full" />
                    <div className="h-3 bg-gray-50 rounded-full w-5/6" />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-20 left-12 right-12 flex justify-between items-end">
                <div className="w-32 border-t border-gray-200 pt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Agent Signature</div>
                <div className="w-32 border-t border-gray-200 pt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vault Verification Seal</div>
              </div>
              
              {/* Status Overlay */}
              {doc.status === "approved" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] opacity-20 select-none pointer-events-none">
                  <div className="border-8 border-green-600 rounded-full p-8 flex flex-col items-center">
                    <ShieldCheck size={120} className="text-green-600" />
                    <span className="text-4xl font-black text-green-600 mt-2 uppercase tracking-widest">VERIFIED</span>
                  </div>
                </div>
              )}
              {doc.status === "rejected" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] opacity-20 select-none pointer-events-none">
                  <div className="border-8 border-red-600 rounded-full p-8 flex flex-col items-center">
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
                    <p className="text-xs font-medium text-gray-500">File Size</p>
                    <p className="text-sm font-bold text-[#141414]">2.4 MB</p>
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

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Verification Actions</h4>
              <div className="space-y-3">
                <button 
                  disabled={updating || doc.status === "approved"}
                  onClick={() => handleAction("approved")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} 
                  Approve & Verify
                </button>
                <button 
                  disabled={updating || doc.status === "rejected"}
                  onClick={() => handleAction("rejected")}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />} 
                  Reject Document
                </button>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                <Download size={16} /> Download Original PDF
              </button>
            </div>
            
            <div className="mt-auto pt-8">
              <div className="bg-gray-50 text-gray-500 p-4 rounded-xl text-xs font-medium flex items-start gap-2">
                <Lock size={14} className="shrink-0 mt-0.5" />
                <p>Encrypted Audit Log: Verified by Vantage OS Node #882</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};