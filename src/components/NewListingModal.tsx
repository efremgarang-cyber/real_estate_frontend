import React, { useState, useRef, useEffect } from "react";
import { X, Loader2, ArrowRight, Upload, Trash2, Wand2, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { propertyApi } from "../api/properties";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase"; 

interface NewListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PREDEFINED_AMENITIES = [
  "CCTV Camera", "Reliable Water Supply (Borehole)", "Internet Provision",
  "Dedicated Parking", "Lifts & Staircase", "Backup Generator (Common Areas)",
  "Swimming Pool", "Fully Equipped Gym", "Balcony / Terrace",
  "Air Conditioning", "Pet Friendly", "24/7 Manned Security", "Other",
];

interface ImageState {
  file: File;
  preview: string;
}

export const NewListingModal: React.FC<NewListingModalProps> = ({ onClose, onSuccess }) => {
  // --- UI State ---
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  // --- Form State ---
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Apartment");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [currentRent, setCurrentRent] = useState("");
  const [status, setStatus] = useState("Active");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [description, setDescription] = useState("");

  // --- Amenities State ---
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [otherAmenity, setOtherAmenity] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Media State ---
  const [mainImage, setMainImage] = useState<ImageState | null>(null);
  const [interiorImages, setInteriorImages] = useState<ImageState[]>([]);
  const [exteriorImages, setExteriorImages] = useState<ImageState[]>([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAmenitiesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clean up object URLs to prevent memory leaks when component unmounts
  useEffect(() => {
    return () => {
      if (mainImage) URL.revokeObjectURL(mainImage.preview);
      interiorImages.forEach(img => URL.revokeObjectURL(img.preview));
      exteriorImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [mainImage, interiorImages, exteriorImages]);

  // --- Handlers ---
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const getFinalAmenitiesList = () => {
    const final = selectedAmenities.filter(a => a !== "Other");
    if (selectedAmenities.includes("Other") && otherAmenity.trim()) {
      final.push(otherAmenity.trim());
    }
    return final;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, category: "main" | "interior" | "exterior") => {
    if (!e.target.files) return;
    
    const newImages = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    if (category === "main" && newImages.length > 0) setMainImage(newImages[0]);
    if (category === "interior") setInteriorImages(prev => [...prev, ...newImages]);
    if (category === "exterior") setExteriorImages(prev => [...prev, ...newImages]);
  };

  const handleGenerateAI = async () => {
    if (!city || !location || !price) {
      return alert("Please fill in the City, Location, and Asking Price first.");
    }
    setIsGeneratingAI(true);
    try {
      const response = await api.post("/properties/marketing/generate", {
        property_type: type,
        location: `${location}, ${city}`,
        price,
        bedrooms: Number(beds) || null,
        bathrooms: Number(baths) || null,
        features: getFinalAmenitiesList(),
        target_audience: "high-net-worth buyers",
      });
      
      if (response.data) {
        setTitle(response.data.catchy_title);
        setDescription(response.data.full_description);
        setAiGenerated(true);
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
      alert("Failed to generate marketing copy.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!mainImage) return alert("A Main Property Image is required.");
    if (interiorImages.length === 0) return alert("At least one Interior Image is required.");
    if (exteriorImages.length === 0) return alert("At least one Exterior Image is required.");

    setSubmitting(true);
    try {
      const uploadToSupabase = async (img: ImageState, folder: string) => {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `properties/${folder}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('user-files') 
          .upload(filePath, img.file, { cacheControl: '3600', upsert: false });

        if (error) throw error;
        return data.path; 
      };

      const [mainPath, interiorPaths, exteriorPaths] = await Promise.all([
        uploadToSupabase(mainImage, 'main'),
        Promise.all(interiorImages.map(img => uploadToSupabase(img, 'interior'))),
        Promise.all(exteriorImages.map(img => uploadToSupabase(img, 'exterior')))
      ]);

      await propertyApi.create({
        title, city, location, type,
        price: Number(price),
        service_charge: serviceCharge ? Number(serviceCharge) : null,
        current_rent: currentRent ? Number(currentRent) : null,
        bedrooms: Number(beds),
        baths: Number(baths),
        sqft: Number(sqft),
        description, status,
        features: getFinalAmenitiesList(),
        images: { main: mainPath, interior: interiorPaths, exterior: exteriorPaths },
      } as any);
      
      onSuccess();
    } catch (err) {
      console.error("Listing creation failed:", err);
      alert("Upload failed. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414]";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#141414]/40 backdrop-blur-sm flex items-center justify-center p-6 font-sans">
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-bold text-[#141414]">Publish New Listing</h3>
          <button type="button" onClick={onClose} disabled={submitting || isGeneratingAI} className="cursor-pointer text-gray-400 hover:text-[#141414] transition-colors p-1 rounded-lg disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Property Title</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The Oribi Penthouse, Muthaiga" className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">City</label>
              <select required value={city} onChange={e => setCity(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
                <option value="" disabled>Select City...</option>
                {["Nairobi","Mombasa","Nakuru","Kisumu","Eldoret","Naivasha","Other"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Neighborhood / Area</label>
              <input type="text" required value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Karen, Kilimani" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Property Type</label>
              <select required value={type} onChange={e => setType(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
                <option value="Apartment">Apartment</option>
                <option value="Maisonette">Maisonette</option>
                <option value="Townhouse">Townhouse</option>
                <option value="Villa">Villa</option>
                <option value="Commercial">Commercial</option>
                <option value="Land">Land</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Listing Status</label>
              <select required value={status} onChange={e => setStatus(e.target.value)} className={cn(inputClass, "cursor-pointer")}>
                <option value="Active">Active</option>
                <option value="Under Contract">Under Contract</option>
                <option value="Closed">Closed</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-gray-100 py-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Asking Price</label>
              <input type="number" required value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 85000000" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Service Chg/mo</label>
              <input type="number" value={serviceCharge} onChange={e => setServiceCharge(e.target.value)} placeholder="Optional" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Rent/mo</label>
              <input type="number" value={currentRent} onChange={e => setCurrentRent(e.target.value)} placeholder="If tenanted" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Beds", value: beds, setter: setBeds },
              { label: "Baths", value: baths, setter: setBaths },
              { label: "Area (SQFT)", value: sqft, setter: setSqft },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
                <input type="number" required value={value} onChange={e => setter(e.target.value)} placeholder="0" className={inputClass} />
              </div>
            ))}
          </div>

          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Amenities / Features</label>
            <button type="button" onClick={() => setIsAmenitiesOpen(!isAmenitiesOpen)} className={cn(inputClass, "flex items-center justify-between cursor-pointer")}>
              <span className={selectedAmenities.length === 0 ? "text-gray-400" : ""}>
                {selectedAmenities.length === 0 ? "Select Amenities..." : `${selectedAmenities.length} selected`}
              </span>
              <ChevronDown size={16} className={cn("transition-transform duration-200", isAmenitiesOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isAmenitiesOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                    {PREDEFINED_AMENITIES.map(amenity => (
                      <label key={amenity} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", selectedAmenities.includes(amenity) ? "bg-[#141414] border-[#141414]" : "border-gray-300 group-hover:border-gray-400")}>
                          {selectedAmenities.includes(amenity) && <Check size={14} className="text-white" />}
                        </div>
                        <span className="text-sm text-[#141414] font-medium">{amenity}</span>
                        <input type="checkbox" className="hidden" checked={selectedAmenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />
                      </label>
                    ))}
                  </div>
                  {selectedAmenities.includes("Other") && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                      <input type="text" value={otherAmenity} onChange={e => setOtherAmenity(e.target.value)} placeholder="Please specify other amenities..." className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#141414] text-sm text-[#141414]" />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-[#141414] flex items-center gap-2">
                <Wand2 size={15} className="text-[#D4AF37]" /> Makao Marketing Agent
              </h4>
              <p className="text-xs text-gray-500 mt-1">Auto-write high-converting copy from your inputs and amenities.</p>
            </div>
            <button type="button" onClick={handleGenerateAI} disabled={isGeneratingAI || !city || !price} className="cursor-pointer flex w-full sm:w-auto items-center justify-center gap-2 bg-[#141414] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-black transition-colors disabled:opacity-50 shrink-0">
              {isGeneratingAI ? <><Loader2 size={13} className="animate-spin" /> Writing...</> : <><Wand2 size={13} /> Generate Copy</>}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Public Summary Description</label>
              {aiGenerated && <span className="flex items-center gap-1 text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest"><Wand2 size={10} /> AI Generated</span>}
            </div>
            <textarea required value={description} onChange={e => { setDescription(e.target.value); setAiGenerated(false); }} placeholder="Provide descriptive context for prospective buyers..." className={cn("w-full h-32 p-4 bg-white border rounded-xl text-sm focus:outline-none focus:ring-1 resize-y transition-all text-[#141414] custom-scrollbar", aiGenerated ? "border-[#D4AF37] focus:border-[#D4AF37] focus:ring-[#D4AF37]" : "border-gray-300 focus:border-[#141414] focus:ring-[#141414]")} />
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-2">Main Hero Image</label>
              {!mainImage ? (
                <div className="relative group border-2 border-dashed border-gray-300 hover:border-[#141414] rounded-xl p-5 transition-all bg-gray-50/50 hover:bg-white text-center cursor-pointer">
                  <input type="file" accept="image/*" onChange={e => handleImageChange(e, "main")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="flex flex-col items-center gap-1">
                    <Upload size={16} className="text-gray-400 group-hover:text-[#141414] transition-colors" />
                    <p className="text-xs font-bold text-[#141414]">Upload Main Image</p>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-video max-w-sm rounded-xl overflow-hidden border border-gray-100 group">
                  <img src={mainImage.preview} alt="Main" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setMainImage(null)} className="cursor-pointer absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-xl">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {(["interior", "exterior"] as const).map(cat => (
              <div key={cat}>
                <label className="block text-xs font-semibold text-[#141414] uppercase tracking-wider mb-2">{cat === "interior" ? "Interior Spaces" : "Exterior Details"}</label>
                <div className="relative group border-2 border-dashed border-gray-300 hover:border-[#141414] rounded-xl p-5 transition-all bg-gray-50/50 hover:bg-white text-center cursor-pointer mb-3">
                  <input type="file" multiple accept="image/*" onChange={e => handleImageChange(e, cat)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="flex flex-col items-center gap-1">
                    <Upload size={16} className="text-gray-400 group-hover:text-[#141414] transition-colors" />
                    <p className="text-xs font-bold text-[#141414]">Add {cat === "interior" ? "Interior" : "Exterior"} Images</p>
                  </div>
                </div>
                {(cat === "interior" ? interiorImages : exteriorImages).length > 0 && (
                  <div className="grid grid-cols-4 gap-2.5">
                    {(cat === "interior" ? interiorImages : exteriorImages).map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                        <img src={img.preview} alt={`${cat} ${i}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => cat === "interior" ? setInteriorImages(p => p.filter((_, idx) => idx !== i)) : setExteriorImages(p => p.filter((_, idx) => idx !== i))} className="cursor-pointer absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-xl">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button type="submit" disabled={submitting || isGeneratingAI} className="cursor-pointer w-full flex items-center justify-center gap-2 py-3.5 mt-6 bg-[#141414] hover:bg-black text-white rounded-xl font-medium transition-colors disabled:opacity-70 text-sm shadow-sm">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <><span>Commit Listing</span><ArrowRight size={18} /></>}
          </button>
          
        </form>
      </motion.div>
    </motion.div>
  );
};