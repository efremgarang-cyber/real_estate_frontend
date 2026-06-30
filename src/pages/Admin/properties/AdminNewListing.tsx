import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Plus, Building2, Upload, Trash2 } from "lucide-react";
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
    city: "", 
    otherCity: "", // New state for custom city
    price: "",
    bedrooms: "", 
    baths: "",
    sqft: "",
    description: "",
    status: "Active"
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const createListingMutation = useMutation({
    mutationFn: async (data: any) => {
      return propertyApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"] });
      handleCloseAndReset();
    }
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setImagePreviews((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImagePreviews((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCloseAndReset = () => {
    setFormData({ title: "", location: "", city: "", otherCity: "", price: "", bedrooms: "", baths: "", sqft: "", description: "", status: "Active" });
    setImagePreviews([]);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      title: formData.title,
      location: formData.location, 
      city: formData.city === "Other" ? formData.otherCity : formData.city,
      price: Number(formData.price),
      bedrooms: Number(formData.bedrooms),
      baths: Number(formData.baths),
      sqft: Number(formData.sqft),
      description: formData.description,
      status: formData.status,
      images: imagePreviews
    };

    createListingMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#0A0A0A] border border-neutral-200/60 dark:border-gray-800 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 size={20} className="text-neutral-400" /> Publish New Listing
          </h1>
          <button onClick={handleCloseAndReset} className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Property Title</label>
            <input name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. The Oribi Penthouse, Muthaiga" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">City</label>
              <select name="city" required value={formData.city} onChange={handleChange} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm">
                <option value="">Select City...</option>
                <option value="Nairobi">Nairobi</option>
                <option value="Mombasa">Mombasa</option>
                <option value="Kisumu">Kisumu</option>
                <option value="Nakuru">Nakuru</option>
                <option value="Eldoret">Eldoret</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.city === "Other" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Specify City</label>
                <input name="otherCity" required value={formData.otherCity} onChange={handleChange} placeholder="Type your city..." className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Neighborhood / Area</label>
              <input name="location" required value={formData.location} onChange={handleChange} placeholder="e.g. Karen, Kilimani" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
            </div>
          </div>

          {/* Rest of the form remains same as requested */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Asking Price (KES)</label>
              <input type="number" name="price" required value={formData.price} onChange={handleChange} placeholder="e.g. 85000000" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Listing Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm">
                <option value="Active">Active</option>
                <option value="Under Contract">Under Contract</option>
                <option value="Closed">Closed</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Beds</label>
              <input type="number" name="bedrooms" required value={formData.bedrooms} onChange={handleChange} placeholder="0" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Baths</label>
              <input type="number" name="baths" required value={formData.baths} onChange={handleChange} placeholder="0" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Area (Sqft)</label>
              <input type="number" name="sqft" required value={formData.sqft} onChange={handleChange} placeholder="Sqft" className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Property Media Assets (Local Disk Upload)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-200 hover:border-black rounded-xl p-6 bg-neutral-50/50 text-center cursor-pointer transition-all group"
            >
              <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
              <Upload size={20} className="mx-auto text-neutral-400 group-hover:text-black mb-2" />
              <p className="text-xs font-bold">Click to upload or drag files here</p>
              <p className="text-[10px] text-neutral-400 mt-1">Supports PNG, JPG, JPEG, or WEBP extensions</p>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group border border-neutral-200">
                    <img src={src} className="w-full h-full object-cover" alt="preview" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Public Summary Description</label>
            <textarea name="description" rows={3} required value={formData.description} onChange={handleChange} placeholder="Provide descriptive context for prospective buyers..." className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={handleCloseAndReset} className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold hover:bg-neutral-50">
              Cancel
            </button>
            <button type="submit" disabled={createListingMutation.isPending} className="flex-[2] bg-[#1A1A1A] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all">
              {createListingMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Commit Listing →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};