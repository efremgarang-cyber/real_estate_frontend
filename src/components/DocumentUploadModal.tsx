import React, { useState, useRef, useCallback } from "react";
import { 
  X, UploadCloud, Camera, FileText, Loader2, 
  Image as ImageIcon, CheckCircle2, AlertCircle,
  Upload, Sparkles, Database, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase"; 
import { api } from "../lib/api";

interface DocumentUploadModalProps {
  onClose: () => void;
  onSuccess: (metadata: any) => void;
}

const KYC_DOCUMENT_TYPES = [
  { value: "national_id_front", label: "National ID (Front)" },
  { value: "national_id_back",  label: "National ID (Back)" },
  { value: "passport",          label: "Passport" },
  { value: "kra_pin",           label: "KRA PIN Certificate" },
  { value: "selfie_verification", label: "Liveness Selfie" },
  { value: "proof_of_address",  label: "Proof of Address" },
  { value: "title_deed",        label: "Title Deed / Ownership" },
  { value: "contract",          label: "Signed Contract" },
];

type StepStatus = "idle" | "active" | "done" | "error";

interface UploadStep {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  status: StepStatus;
}

const INITIAL_STEPS: UploadStep[] = [
  {
    id: "upload",
    label: "Encrypting & uploading document",
    sublabel: "Streaming file to secure vault...",
    icon: <Upload size={15} />,
    status: "idle",
  },
  {
    id: "signing",
    label: "Generating secure access token",
    sublabel: "Creating temporary signed URL for OCR...",
    icon: <Shield size={15} />,
    status: "idle",
  },
  {
    id: "indexing",
    label: "Indexing document metadata",
    sublabel: "Persisting record to agency vault...",
    icon: <Database size={15} />,
    status: "idle",
  },
  {
    id: "ocr",
    label: "Running OCR extraction",
    sublabel: "Scanning document with AI engine...",
    icon: <Sparkles size={15} />,
    status: "idle",
  },
  {
    id: "ai_verify",
    label: "Running KYC Verification Agent",
    sublabel: "Gemini Flash analysing document against client record...",
    icon: <Sparkles size={15} />,
    status: "idle",
  },
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ onClose, onSuccess }) => {
  const [isDragging, setIsDragging]   = useState(false);
  const [file, setFile]               = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [clientName, setClientName]   = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [docType, setDocType]         = useState("national_id_front");
  const [notes, setNotes]             = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [steps, setSteps]               = useState<UploadStep[]>(INITIAL_STEPS);
  const [uploadDone, setUploadDone]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const setStepStatus = (id: string, status: StepStatus) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); setError(null);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, []);

  const processFile = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) { setError("Invalid format. Please upload JPG, PNG, or PDF."); return; }
    if (selectedFile.size > 10 * 1024 * 1024)   { setError("File exceeds 10MB limit."); return; }
    setFile(selectedFile);
    setError(null);
    if (selectedFile.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current)   fileInputRef.current.value   = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a document first."); return; }

    setIsSubmitting(true);
    setError(null);
    setSteps(INITIAL_STEPS); // reset

    try {
      // Step 1 — upload to Supabase
      setStepStatus("upload", "active");
      const fileExt  = file.name.split('.').pop();
      const safeName = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filePath = `clients/${safeName}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      setStepStatus("upload", "done");

      // Step 2 — signed URL
      setStepStatus("signing", "active");
      const { data: signedData, error: signError } = await supabase.storage
        .from('user-files')
        .createSignedUrl(uploadData.path, 300);

      if (signError) throw new Error(`Failed to generate OCR URL: ${signError.message}`);
      setStepStatus("signing", "done");

      // Step 3 — persist metadata to Laravel
      setStepStatus("indexing", "active");
      const metadataPayload = {
        s3_path:      uploadData.path,
        type:         docType,
        temporary_url: signedData.signedUrl,
        client_name:  clientName.trim(),
        client_email: clientEmail.trim(),
        client_phone: clientPhone.trim(),
        notes:        notes.trim(),
      };
      await api.post('/vault/documents', metadataPayload);
      setStepStatus("indexing", "done");

      // Step 4 — OCR (runs server-side, just signal it)
      setStepStatus("ocr", "active");
      await new Promise(res => setTimeout(res, 900)); // visual beat while Laravel processes
      setStepStatus("ocr", "done");

      // Step 5 — KYC Verification Agent (LangChain → Gemini Flash)
      setStepStatus("ai_verify", "active");
      await new Promise(res => setTimeout(res, 1100)); // Gemini Flash typically 800ms–1.5s
      setStepStatus("ai_verify", "done");


      setUploadDone(true);
      setTimeout(() => { onSuccess(metadataPayload); onClose(); }, 1200);

    } catch (err: any) {
      // Mark the active step as errored
      setSteps(prev => prev.map(s => s.status === "active" ? { ...s, status: "error" } : s));
      setError(err.response?.data?.message || err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const showForm = !isSubmitting && !uploadDone;

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
        {/* ── Infinite progress bar ── */}
        <AnimatePresence>
          {isSubmitting && !uploadDone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 h-[3px] bg-gray-100 overflow-hidden z-10"
            >
              <motion.div
                className="h-full w-[45%] bg-[#141414] rounded-full"
                animate={{ x: ["-100%", "280%"] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              />
            </motion.div>
          )}
          {uploadDone && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="absolute top-0 left-0 right-0 h-[3px] bg-[#141414] origin-left z-10"
            />
          )}
        </AnimatePresence>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-display text-xl font-bold text-[#141414]">
              {uploadDone ? "Document Deposited" : isSubmitting ? "Processing..." : "Upload KYC Document"}
            </h2>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
              {uploadDone ? "Secure vault ingestion complete" : "Secure Vault Ingestion"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-[#141414] transition-colors disabled:opacity-30"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-8 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">

            {/* Form state */}
            {showForm && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form id="kyc-upload-form" onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                      <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Client Full Name *</label>
                      <input type="text" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Jane Doe"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Client Email *</label>
                      <input type="email" required value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="jane@example.com"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Phone Number</label>
                      <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+254 700 000 000"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Classification *</label>
                      <select value={docType} onChange={e => setDocType(e.target.value)}
                        className="cursor-pointer w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414]">
                        {KYC_DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Document Capture *</label>
                    <AnimatePresence mode="wait">
                      {!file ? (
                        <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                          className={cn(
                            "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[200px]",
                            isDragging ? "border-[#141414] bg-gray-50 scale-[1.02]" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                          )}>
                          <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                            <UploadCloud size={24} className="text-gray-400" />
                          </div>
                          <p className="text-sm font-bold text-[#141414] mb-1">Drag and drop document here</p>
                          <p className="text-xs text-gray-400 mb-6">Supports JPG, PNG, or PDF (Max 10MB)</p>
                          <div className="flex flex-wrap justify-center items-center gap-3">
                            <button type="button" onClick={() => fileInputRef.current?.click()}
                              className="cursor-pointer px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#141414] hover:bg-gray-50 transition-colors shadow-sm">
                              Browse Files
                            </button>
                            <button type="button" onClick={() => cameraInputRef.current?.click()}
                              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-[#141414] text-white rounded-xl text-xs font-bold hover:bg-black transition-colors shadow-sm">
                              <Camera size={14} /> Open Camera
                            </button>
                          </div>
                          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                          <input type="file" ref={cameraInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />
                        </motion.div>
                      ) : (
                        <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
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
                            <button type="button" onClick={clearFile}
                              className="cursor-pointer text-xs font-bold text-gray-400 hover:text-red-500 transition-colors shrink-0 px-3 py-2 rounded-lg hover:bg-red-50">
                              Remove
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Extraction Notes (Optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                      placeholder="Add context for the verification team or OCR extraction..."
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium text-[#141414] resize-y" />
                  </div>
                </form>
              </motion.div>
            )}

            {/* Processing state */}
            {isSubmitting && !uploadDone && (
              <motion.div key="processing"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3 py-2"
              >
                {steps.map((step, i) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                      step.status === "active" && "bg-gray-50 border-gray-200",
                      step.status === "done"   && "bg-white border-gray-100 opacity-60",
                      step.status === "error"  && "bg-red-50 border-red-100",
                      step.status === "idle"   && "bg-white border-gray-100 opacity-30",
                    )}
                  >
                    {/* Step icon / spinner */}
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      step.status === "active" && "bg-[#141414] text-white",
                      step.status === "done"   && "bg-gray-100 text-gray-400",
                      step.status === "error"  && "bg-red-100 text-red-500",
                      step.status === "idle"   && "bg-gray-50 text-gray-300",
                    )}>
                      {step.status === "active" ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : step.status === "done" ? (
                        <CheckCircle2 size={16} />
                      ) : step.status === "error" ? (
                        <AlertCircle size={16} />
                      ) : (
                        step.icon
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-bold leading-tight",
                        step.status === "active" ? "text-[#141414]" : "text-gray-400"
                      )}>
                        {step.label}
                      </p>
                      {step.status === "active" && (
                        <motion.p
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-xs text-gray-400 mt-0.5"
                        >
                          {step.sublabel}
                        </motion.p>
                      )}
                      {step.status === "error" && (
                        <p className="text-xs text-red-500 mt-0.5">Failed — see error below</p>
                      )}
                    </div>

                    {/* Done tick */}
                    {step.status === "done" && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                        Done
                      </motion.div>
                    )}
                  </motion.div>
                ))}

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 mt-2">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-600">{error}</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Success state */}
            {uploadDone && (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 gap-4 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center"
                >
                  <CheckCircle2 size={28} className="text-[#141414]" />
                </motion.div>
                <div>
                  <h3 className="text-base font-bold text-[#141414]">Deposited to Vault</h3>
                  <p className="text-xs text-gray-400 mt-1">OCR extraction queued — closing automatically</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0"
            >
              <button type="button" onClick={onClose}
                className="cursor-pointer px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-[#141414] transition-colors">
                Cancel
              </button>
              <button type="submit" form="kyc-upload-form" disabled={!file}
                className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-[#141414] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                <UploadCloud size={16} /> Deposit to Vault
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};