import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  X, 
  UploadCloud, 
  Camera, 
  FileText, 
  Loader2, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
// Make sure these paths match your project structure!
import { supabase } from "../lib/supabase"; 
import { api } from "../lib/api";

interface DocumentUploadModalProps {
  onClose: () => void;
  onSuccess: () => void; 
}

const KYC_DOCUMENT_TYPES = [
  { value: "national_id_front", label: "National ID (Front)" },
  { value: "national_id_back", label: "National ID (Back)" },
  { value: "passport", label: "Passport" },
  { value: "kra_pin", label: "KRA PIN Certificate" },
  { value: "selfie_verification", label: "Liveness Selfie" },
  { value: "proof_of_address", label: "Proof of Address" },
  { value: "title_deed", label: "Title Deed / Ownership" },
  { value: "contract", label: "Signed Contract" }
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ onClose, onSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [docType, setDocType] = useState<string>("national_id_front");
  const [notes, setNotes] = useState("");
  
  // Submission & Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // --- Drag and Drop Handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  // --- File Processing ---
  const processFile = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Invalid file format. Please upload a JPG, PNG, or PDF.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // --- Submission Logic with Supabase & Laravel ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select or capture a document first.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Generate a safe file path (using the selected integer ID to keep paths clean)
      const fileExt = file.name.split('.').pop();
      const safeName = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filePath = `clients/${safeName}-${Date.now()}/${fileExt}`;

      // 2. Upload directly to Supabase from the React client
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Supabase Upload Failed: ${uploadError.message}`);

      // 3. Generate the 60-second temporary signed URL for the OCR API
      const { data: signedData, error: signError } = await supabase.storage
        .from('user-files')
        .createSignedUrl(uploadData.path, 60);

      if (signError) throw new Error(`Failed to generate OCR URL: ${signError.message}`);

      // 4. Send the payload to your Laravel Backend
      await api.post('/vault/documents', {
        s3_path: uploadData.path,
        type: docType,
        temporary_url: signedData.signedUrl,
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        client_phone: clientPhone.trim(),
        notes: notes.trim()
      });

      // 5. Trigger parent success (to refresh the table/UI) and close
      onSuccess();
      onClose();

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => !isSubmitting && onClose()}
        className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-display text-xl font-bold text-[#141414]">Upload KYC Document</h2>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Secure Vault Ingestion</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-[#141414] transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form id="kyc-upload-form" onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* SMART COMPONENT: Client Dropdown */}
              <div>
                <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Client Full Name *</label>
                <input 
                  type="text" required
                  value={clientName} onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Client Email *</label>
                <input 
                  type="email" required
                  value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Phone Number</label>
                <input 
                  type="tel"
                  value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Classification *</label>
                <select 
                  value={docType} onChange={(e) => setDocType(e.target.value)} disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414]"
                >
                  {KYC_DOCUMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Classification *</label>
                <select 
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414]"
                >
                  {KYC_DOCUMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Document Capture *</label>
              
              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div 
                    key="upload-zone"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[200px]",
                      isDragging ? "border-[#141414] bg-gray-50 scale-[1.02]" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                    )}
                  >
                    <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                      <UploadCloud size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-bold text-[#141414] mb-1">Drag and drop document here</p>
                    <p className="text-xs text-gray-400 mb-6">Supports JPG, PNG, or PDF (Max 10MB)</p>
                    
                    <div className="flex flex-wrap justify-center items-center gap-3">
                      <button 
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#141414] hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        Browse Files
                      </button>
                      
                      <button 
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center gap-2 cursor-pointer px-5 py-2.5 bg-[#141414] text-white rounded-xl text-xs font-bold hover:bg-black transition-colors shadow-sm"
                      >
                        <Camera size={14} /> Open Camera
                      </button>
                    </div>

                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png,.webp" 
                    />
                    <input 
                      type="file" 
                      ref={cameraInputRef} 
                      onChange={handleFileSelect} 
                      className="hidden" 
                      accept="image/*" 
                      capture="environment" 
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="file-preview"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50"
                  >
                    {previewUrl ? (
                      <div className="aspect-video bg-[#141414] relative flex items-center justify-center">
                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs font-semibold text-white">
                          <CheckCircle2 size={14} className="text-green-400" /> Image Ready
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center bg-gray-100 border-b border-gray-200">
                        <FileText size={48} className="text-gray-300 mb-3" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">PDF Document Selected</span>
                      </div>
                    )}
                    
                    <div className="p-4 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          {file.type.includes('pdf') ? <FileText size={18} className="text-gray-500" /> : <ImageIcon size={18} className="text-gray-500" />}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-[#141414] truncate">{file.name}</p>
                          <p className="text-xs font-medium text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        disabled={isSubmitting}
                        onClick={clearFile}
                        className="text-xs font-bold cursor-pointer text-gray-400 hover:text-red-500 transition-colors shrink-0 px-3 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Extraction Notes (Optional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any specific context for the verification team or ML extraction rules..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414] min-h-[80px] resize-y"
              />
            </div>
          </form>
        </div>

        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-[#141414] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="kyc-upload-form"
            disabled={!file || isSubmitting}
            className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-[#141414] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            {isSubmitting ? "Encrypting & Uploading..." : "Deposit to Vault"}
          </button>
        </div>

      </motion.div>
    </div>
  );
};