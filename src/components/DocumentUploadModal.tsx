import React, { useState, useRef } from "react";
import { X, UploadCloud, File, Loader2 } from "lucide-react";

interface DocumentUploadModalProps {
  onClose: () => void;
  onSuccess: (payload: { file: File; type: string; userId?: string; notes?: string }) => Promise<void>;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("kyc");
  const [userId, setUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !userId.trim()) return;

    setIsSubmitting(true);
    await onSuccess({
      file,
      type,
      userId: userId.trim(),
      notes: notes.trim()
    });
    // The modal closes automatically via VaultPage on success, but we stop the spinner if it fails
    setIsSubmitting(false); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-[#141414]">Upload to Vault</h3>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* File Dropzone */}
          <div 
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-colors ${
              file ? 'border-[#141414] bg-gray-50' : 'border-gray-300 hover:border-[#141414] hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden" 
              accept=".pdf,.jpg,.jpeg,.png"
            />
            
            {file ? (
              <>
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#141414] mb-2">
                  <File size={20} />
                </div>
                <p className="text-sm font-bold text-[#141414] truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mb-2">
                  <UploadCloud size={20} />
                </div>
                <p className="text-sm font-bold text-[#141414]">Click to select document</p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG up to 10MB</p>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Client ID *</label>
            <input 
              type="text" 
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. USR-3322"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Document Type *</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] text-sm"
            >
              <option value="kyc">KYC / Identity</option>
              <option value="title_deed">Title Deed</option>
              <option value="contract">Signed Contract</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add verification notes..."
              rows={2}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] text-sm resize-none"
            />
          </div>

          {/* The fix is here: Ensure both file AND userId exist before enabling */}
          <button 
            type="submit"
            disabled={!file || !userId.trim() || isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] text-white rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            {isSubmitting ? "Encrypting & Uploading..." : "Deposit to Vault"}
          </button>

        </form>
      </div>
    </div>
  );
};