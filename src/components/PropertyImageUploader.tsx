import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface PropertyImageUploaderProps {
  onImagesChange: (files: File[]) => void;
}

export const PropertyImageUploader: React.FC<PropertyImageUploaderProps> = ({ onImagesChange }) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    const updatedFiles = [...selectedImages, ...validFiles];
    setSelectedImages(updatedFiles);
    onImagesChange(updatedFiles);

    // Generate blob URLs for UI previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    const updatedFiles = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedFiles);
    onImagesChange(updatedFiles);

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">
        Property Gallery Images
      </label>

      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[140px]
          ${isDragging 
            ? 'border-black bg-gray-50 scale-[0.99]' 
            : 'border-gray-200 hover:border-gray-400 bg-white'}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          multiple
          accept="image/*"
          className="hidden"
        />
        
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-700">
          Drag and drop listing images here, or <span className="text-black underline font-semibold">browse files</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, JPEG up to 5MB each</p>
      </div>

      {/* Grid Thumbnail Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-3 pt-2">
          {previews.map((url, index) => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
              <img src={url} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-white hover:bg-black transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};