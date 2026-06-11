// src/components/DocumentUploadModal.tsx

import React, { useState, useRef } from "react";
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { vaultApi } from "../api/vault";
import { api } from "../lib/api";
import { SecureDocumentType } from "../types";

interface DocumentUploadModalProps {
  onClose: () => void;
  onSuccess: (metadata: any) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<SecureDocumentType>("kyc");
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF, JPEG, and PNG files are allowed");
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    if (!clientId) {
      setError("Please enter Client ID");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // FIXED: Safely passing all 3 arguments dynamically down to the workflow
      const filePath = await vaultApi.executeSecureUpload(selectedFile, documentType, clientId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const metadata = {
        file_path: filePath,
        document_type: documentType,
        user_id: clientId,
        notes: notes,
        original_name: selectedFile.name,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        status: 'pending'
      };

      onSuccess(metadata);
      
    } catch (err: any) {
      console.error("Upload failed:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : "Validation failed.");
      } else {
        setError("Failed to upload document. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Upload size={20} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-[#141414]">Upload Document</h3>
          </div>
          <button title="onclose" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Client ID *</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter client ID"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Document Type *</label>
            <select title="document"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as SecureDocumentType)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
            >
              <option value="kyc">KYC Document</option>
              <option value="title_deed">Title Deed</option>
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="utility_bill">Utility Bill</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">File *</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#141414] transition-colors"
            >
              <input title="file"
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText size={24} className="text-green-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
              ) : (
                <div>
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPEG, PNG (max 10MB)</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414]"
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#141414] h-full rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }} 
                />
              </div>
              <p className="text-xs text-gray-500 text-center">Uploading... {uploadProgress}%</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !clientId || isUploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#141414] hover:bg-black text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};