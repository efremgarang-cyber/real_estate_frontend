// src/pages/Admin/properties/AdminNewListing.tsx
import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Plus, Building2, Upload } from "lucide-react";
import { propertyApi } from "../../../api/properties";
import { CreatePropertyPayload } from "../../../types"; 

interface AdminNewListingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminNewListing: React.FC<AdminNewListingProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    location: "", 
    price: "",
    bedrooms: "", 
    baths: "",
    sqft: "",
    description: ""
  });

  // State managers to handle local media preview assets
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const createListingMutation = useMutation({
    mutationFn: async (data: CreatePropertyPayload) => {
      // NOTE: Since you're utilizing MinIO file records, your api might either expect:
      // A) Standard JSON (with a separate media step or processing raw files)
      // B) A standard FormData object if submitting fields alongside images in one route block.
      // E.g., if converting to Multipart payload:
      // const body = new FormData();
      // Object.entries(data).forEach(([k, v]) => body.append(k, String(v)));
      // if (selectedImage) body.append("image", selectedImage);
      // return propertyApi.create(body);

      return propertyApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"] });
      handleCloseAndReset();
    }
  });

  // Completely bypass element composition if window flag is false
  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); // Generate browser buffer URL string for visualization
    }
  };

  const handleCloseAndReset = () => {
    setFormData({ title: "", location: "", price: "", bedrooms: "", baths: "", sqft: "", description: "" });
    setSelectedImage(null);
    setImagePreview(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.location) return;

    const payload: CreatePropertyPayload = {
      title: formData.title,
      address: formData.location, 
      price: Number(formData.price),
      description: formData.description,
      beds: formData.bedrooms ? Number(formData.bedrooms) : 0, 
      baths: formData.baths ? Number(formData.baths) : 0,        
      sqft: formData.sqft ? Number(formData.sqft) : 0,           
    };

    createListingMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white border border-neutral-200/60 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl font-sans text-[#141414] flex flex-col">
        
        {/* Sticky Header Toolbar Context */}
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-8 py-5 flex items-center justify-between z-10">
          <h1 className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Building2 size={18} className="text-neutral-400" /> Create System Listing
          </h1>
          <button 
            type="button"
            onClick={handleCloseAndReset} 
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Main Form Grid Box */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5 flex-1">
          
          {/* ── IMAGE MEDIA UPLOADER FIELD ── */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Property Showcase Media</label>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden" 
            />
            
            {imagePreview ? (
              <div className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 h-44 flex items-center justify-center">
                <img src={imagePreview} alt="Property Showcase Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="bg-white text-neutral-900 text-xs font-bold px-4 py-2 rounded-lg hover:scale-105 transition-transform"
                  >
                    Replace Image
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setSelectedImage(null); setImagePreview(null); }} 
                    className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:scale-105 transition-transform"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-200 hover:border-neutral-400 rounded-xl bg-neutral-50/50 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
              >
                <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Upload size={16} className="text-neutral-500" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-neutral-700">Click to upload imagery file</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Supports PNG, JPG, or WEBP formats</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Property Title</label>
            <input 
              type="text" 
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Premium 4BR Villa Suite" 
              className="w-full px-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Location / Neighborhood</label>
              <input 
                type="text" 
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Nyali, Mombasa" 
                className="w-full px-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Price Base Value (KES)</label>
              <input 
                type="number" 
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 15000000" 
                className="w-full px-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Bedrooms</label>
              <input 
                type="number" 
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                placeholder="4" 
                className="w-full px-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Bathrooms</label>
              <input 
                type="number" 
                name="baths"
                value={formData.baths}
                onChange={handleChange}
                placeholder="3" 
                className="w-full px-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Area (SQFT)</label>
              <input 
                type="number" 
                name="sqft"
                value={formData.sqft}
                onChange={handleChange}
                placeholder="3200" 
                className="w-full px-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Property Description Narrative</label>
            <textarea 
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a comprehensive breakdown of the real estate listing parameters..." 
              className="w-full px-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseAndReset}
              className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-3 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createListingMutation.isPending}
              className="flex-[2] flex items-center justify-center gap-2 bg-[#141414] hover:bg-black text-white py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {createListingMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Committing Listing...
                </>
              ) : (
                <>
                  <Plus size={14} /> Commit & Deploy Listing
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};