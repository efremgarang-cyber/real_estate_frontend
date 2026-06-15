import React, { useState } from "react";
import { X, Loader2, ArrowRight, Upload, Trash2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { propertyApi } from "../api/properties";
import { api } from "../lib/api";

interface NewListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const NewListingModal: React.FC<NewListingModalProps> = ({ onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
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
  
  // Categorized Media State
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [interiorImages, setInteriorImages] = useState<string[]>([]);
  const [exteriorImages, setExteriorImages] = useState<string[]>([]);

  // Category-aware image processor
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'main' | 'interior' | 'exterior') => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      if (category === 'main' && filesArray.length > 0) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") setMainImage(reader.result);
        };
        reader.readAsDataURL(filesArray[0]);
        return;
      }

      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            if (category === 'interior') {
              setInteriorImages((prev) => [...prev, reader.result as string]);
            } else if (category === 'exterior') {
              setExteriorImages((prev) => [...prev, reader.result as string]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeInteriorImage = (indexToRemove: number) => {
    setInteriorImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeExteriorImage = (indexToRemove: number) => {
    setExteriorImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleGenerateAI = async () => {
    if (!city || !location || !price) {
      alert("Please fill in the City, Location, and Asking Price first so the AI has enough context.");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await api.post('/v1/properties/marketing/generate', {
        property_type: "Premium Property", 
        location: `${location}, ${city}`,
        price: String(price),
        bedrooms: Number(beds) || null,
        bathrooms: Number(baths) || null,
        features: [],
        target_audience: "high-net-worth buyers"
      });

      if (response.data) {
        setTitle(response.data.catchy_title);
        setDescription(response.data.full_description);
      }
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      alert("Failed to generate marketing copy. Check console for details.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict media enforcement
    if (!mainImage) return alert("A Main Property Image is required.");
    if (interiorImages.length === 0) return alert("At least one Interior Image is required.");
    if (exteriorImages.length === 0) return alert("At least one Exterior Image is required.");

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
        images: {
          main: mainImage,
          interior: interiorImages,
          exterior: exteriorImages
        }, 
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
        className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-bold text-[#141414]">Publish New Listing</h3>
          <button 
            type="button"
            onClick={onClose} 
            disabled={submitting || isGeneratingAI}
            title="Close modal overlay framework"
            className="cursor-pointer text-gray-400 hover:text-[#141414] transition-colors p-1 rounded-lg focus:outline-none disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Property Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Oribi Penthouse, Muthaiga" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">City</label>
              <select title="city" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm cursor-pointer text-[#141414]">
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
              <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Karen, Kilimani" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Asking Price (KES)</label>
              <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 85000000" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Listing Status</label>
              <select title="status" required value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm cursor-pointer text-[#141414]">
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
              <input type="number" required value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Baths</label>
              <input type="number" required value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Area (SQFT)</label>
              <input type="number" required value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="Sqft" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414]" />
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-300 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <h4 className="text-sm font-bold text-[#141414] flex items-center gap-2">
                <Sparkles size={16} className="text-gray-600" />
                Makao AI Agent
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Auto-write high-converting copy based on inputs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGeneratingAI || !city || !price}
              title="Ensure City, Location, and Price are filled out first."
              className="cursor-pointer flex items-center gap-2 bg-[#141414] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors disabled:opacity-50 shrink-0"
            >
              {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isGeneratingAI ? "Writing..." : "Generate Description"}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Public Summary Description</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide descriptive context for prospective buyers..." className="w-full h-32 p-4 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] resize-y transition-all text-[#141414] custom-scrollbar" />
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100">
            {/* Category 1: Main Image */}
            <div>
              <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-2">
                Main Hero Image * <span className="text-gray-400 font-normal lowercase">(Primary Listing Cover)</span>
              </label>
              {!mainImage ? (
                <div className="relative group border-2 border-dashed border-gray-300 hover:border-[#141414] rounded-xl p-5 transition-all bg-gray-50/50 hover:bg-white text-center cursor-pointer">
                  <input title="main image" type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'main')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Upload size={16} className="text-gray-400 group-hover:text-[#141414] transition-colors" />
                    <p className="text-xs font-bold text-[#141414]">Upload Main Image</p>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-video max-w-sm rounded-xl overflow-hidden border border-gray-100 group">
                  <img src={mainImage} alt="Main thumbnail" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setMainImage(null)} className="cursor-pointer absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-xl focus:outline-none">
                    <Trash2 size={16} className="hover:scale-110 transition-transform" />
                  </button>
                </div>
              )}
            </div>

            {/* Category 2: Interior Images */}
            <div>
              <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-2">
                Interior Spaces * <span className="text-gray-400 font-normal lowercase">(Living, Kitchen, Beds, Baths)</span>
              </label>
              <div className="relative group border-2 border-dashed border-gray-300 hover:border-[#141414] rounded-xl p-5 transition-all bg-gray-50/50 hover:bg-white text-center cursor-pointer mb-3">
                <input title="interior images" type="file" multiple accept="image/*" onChange={(e) => handleImageChange(e, 'interior')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Upload size={16} className="text-gray-400 group-hover:text-[#141414] transition-colors" />
                  <p className="text-xs font-bold text-[#141414]">Add Interior Images</p>
                </div>
              </div>
              {interiorImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2.5">
                  {interiorImages.map((src, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                      <img src={src} alt="Interior thumbnail" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeInteriorImage(index)} className="cursor-pointer absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-xl focus:outline-none">
                        <Trash2 size={14} className="hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category 3: Exterior Images */}
            <div>
              <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-2">
                Exterior Details * <span className="text-gray-400 font-normal lowercase">(Facade, Garden, Parking)</span>
              </label>
              <div className="relative group border-2 border-dashed border-gray-300 hover:border-[#141414] rounded-xl p-5 transition-all bg-gray-50/50 hover:bg-white text-center cursor-pointer mb-3">
                <input title="exterior images" type="file" multiple accept="image/*" onChange={(e) => handleImageChange(e, 'exterior')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Upload size={16} className="text-gray-400 group-hover:text-[#141414] transition-colors" />
                  <p className="text-xs font-bold text-[#141414]">Add Exterior Images</p>
                </div>
              </div>
              {exteriorImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2.5">
                  {exteriorImages.map((src, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                      <img src={src} alt="Exterior thumbnail" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExteriorImage(index)} className="cursor-pointer absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-xl focus:outline-none">
                        <Trash2 size={14} className="hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting || isGeneratingAI} 
            title="Submit listing metadata parameters to live database infrastructure"
            className="cursor-pointer w-full flex items-center justify-center gap-2 py-3.5 mt-6 bg-[#141414] hover:bg-black text-white rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-sm focus:outline-none"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : "Commit Listing"}
            {!submitting && <ArrowRight size={18} />}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};