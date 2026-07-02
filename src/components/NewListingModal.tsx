import React, { useState } from "react";
import { X, Loader2, ArrowRight, Upload, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { propertyApi } from "../api/properties";

interface NewListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const NewListingModal: React.FC<NewListingModalProps> = ({ onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("active");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [description, setDescription] = useState("");
  
  // Local File Previews Storage Array State
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Converts disk images to base64 encoding strings
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

  // Removes a picked file target from state array
  const removeImage = (indexToRemove: number) => {
    setImagePreviews((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await propertyApi.create({
        title,
        city,
        location,
        price: Number(price),
        bedrooms: Number(beds),
        baths: Number(baths),
        sqft: Number(sqft),
        description,
        status,
        images: imagePreviews, // Safely attaches base64 media asset streams to payload
      } as any);
      onSuccess();
    } catch (err) {
      console.error("Failed to commit new listing metadata:", err);
      alert("Validation failed. Please check the network tab for exact payload errors.");
    } finally {
      setSubmitting(false);
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
        className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-bold text-[#141414]">Publish New Listing</h3>
          <button 
            type="button"
            onClick={onClose} 
            title="Close modal overlay framework"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Property Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Oribi Penthouse, Muthaiga" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">City</label>
              <select title="city" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm cursor-pointer text-[#141414]">
                <option value="" disabled>Select City...</option>
                <option value="Nairobi">Nairobi</option>
                <option value="Mombasa">Mombasa</option>
                <option value="Nakuru">Nakuru</option>
                <option value="Kisumu">Kisumu</option>
                <option value="Eldoret">Eldoret</option>
                <option value="Naivasha">Naivasha</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Neighborhood / Area</label>
              <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Karen, Kilimani" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Asking Price (KES)</label>
              <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 85000000" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Listing Status</label>
              <select title="status" required value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm cursor-pointer text-[#141414]">
                <option value="active">Active</option>
                <option value="under_contract">Under Contract</option>
                <option value="closed">Closed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Beds</label>
              <input type="number" required value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Baths</label>
              <input type="number" required value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Area (SQFT)</label>
              <input type="number" required value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="Sqft" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm" />
            </div>
          </div>

          {/* Interactive Drag and Drop Media File Upload Dropzone Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Property Media Assets (Local Disk Upload)
            </label>
            <div className="relative group border-2 border-dashed border-gray-200 hover:border-[#141414] rounded-xl p-5 transition-all bg-gray-50/50 hover:bg-white text-center cursor-pointer">
              <input title="images"
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="flex flex-col items-center justify-center space-y-1">
                <Upload size={16} className="text-gray-400 group-hover:text-[#141414] transition-colors" />
                <p className="text-xs font-bold text-[#141414]">Click to upload or drag files here</p>
                <p className="text-[10px] text-gray-400">Supports PNG, JPG, JPEG, or WEBP extensions</p>
              </div>
            </div>

            {/* Selected Upload Preview Thumbnail Grid Blocks */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2.5 mt-3">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 group">
                    <img src={src} alt="Property thumbnail asset slot" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)} 
                      title="Purge this asset attachment"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-xl focus:outline-none"
                    >
                      <Trash2 size={14} className="hover:scale-110 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Public Summary Description</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide descriptive context for prospective buyers..." className="w-full h-24 p-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] resize-none transition-all text-[#141414]" />
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            title="Submit listing metadata parameters to live database infrastructure"
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-[#141414] hover:bg-black text-white rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-sm focus:outline-none"
          >
            {submitting ? "Publishing Transaction..." : "Commit Listing"}
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};