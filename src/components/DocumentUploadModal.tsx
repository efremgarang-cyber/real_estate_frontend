import React, { useState } from "react";
import { X, ArrowRight, FileText, CheckCircle, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { vaultApi } from "../api/vault";

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (metadata: any) => Promise<void>;
}

const DOCUMENT_TYPES = [
  { label: "National ID", value: "national_id" },
  { label: "Passport", value: "passport" },
  { label: "Title Deed", value: "title_deed" },
  { label: "Utility Bill", value: "utility_bill" }
];

export const DocumentUploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState("");
  const [userId, setUserId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: files => setAcceptedFiles(files),
    multiple: false,
    noClick: true 
  });

  const handleUpload = async () => {
    if (!docType || !userId || acceptedFiles.length === 0) return;
    
    setUploading(true);
    try {
      const file = acceptedFiles[0];
      
      const s3FilePath = await vaultApi.executeSecureUpload(file, 'kyc');

      // Payload strictly matches your backend expectations
      await onSuccess({ 
        type: docType, 
        userId: userId,
        fileName: file.name,
        filePath: s3FilePath,
        status: 'pending'
      });
      
    } catch (error) {
      console.error("Secure upload failed:", error);
      alert("Failed to upload document to secure vault.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#141414]/40 backdrop-blur-sm flex items-center justify-center p-6 font-sans"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-[#141414]">New KYC Deposit</h3>
          <button title="onclose" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Step 1: Select Document Category</p>
            <div className="grid grid-cols-1 gap-3">
              {DOCUMENT_TYPES.map(t => (
                <button 
                  key={t.value}
                  onClick={() => setDocType(t.value)}
                  className={cn(
                    "p-4 rounded-xl text-left font-medium text-sm transition-all flex items-center justify-between border",
                    docType === t.value ? "bg-[#141414] text-white border-[#141414]" : "bg-white border-gray-200 hover:border-[#141414] text-[#141414]"
                  )}
                >
                  {t.label}
                  <ArrowRight size={16} className={docType === t.value ? "opacity-100" : "opacity-0"} />
                </button>
              ))}
            </div>
            <button 
              disabled={!docType}
              onClick={() => setStep(2)}
              className="w-full py-4 mt-4 bg-[#141414] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Step 2: Client & File Association</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">User ID</label>
                <input 
                  type="text" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. USR-8829"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm"
                />
              </div>
              
              <div 
                {...getRootProps()}
                className={cn(
                  "p-8 border-2 border-dashed rounded-2xl transition-all text-center space-y-4 cursor-default",
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50",
                  acceptedFiles.length > 0 && "border-green-500 bg-green-50"
                )}
              >
                <input {...getInputProps()} />
                {/* File Drop UI rendering... */}
              </div>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} disabled={uploading} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-[#141414] rounded-xl font-medium transition-colors">
                Back
              </button>
              <button 
                onClick={handleUpload}
                disabled={!userId || uploading || acceptedFiles.length === 0}
                className="flex-[2] py-4 bg-[#141414] hover:bg-black text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Depositing..." : "Deposit to Vault"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};