import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, MapPin, BedDouble, Bath, Square, 
  Check, Camera, Play, Loader2, ChevronRight 
} from "lucide-react";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api"; 
import { supabase } from "../../lib/supabase"; // FIX: Imported Supabase client

export const PublicPropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [activeMedia, setActiveMedia] = useState<string>("");

  // FIX: Safely resolve the Supabase signed URL or public bucket URL
  const resolveMediaSource = (media: any): string => {
    if (!media) return "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200";
    
    const rawUrl = media.signed_url || media.s3_path || media.url;
    if (!rawUrl) return "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200";

    // 1. If the backend already provided a full HTTP link, use it directly
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }

    // 2. Otherwise, dynamically generate the Supabase URL from the relative DB path
    const { data } = supabase.storage.from('user-files').getPublicUrl(rawUrl);
    return data.publicUrl;
  };

  // Fetch property data natively from your public endpoint
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        // Using your public universal read route
        const response = await api.get(`/properties/${id}`);
        const data = response.data?.data || response.data;
        setProperty(data);
        
        // Set initial gallery media using the secure resolver
        if (data?.images?.length > 0) {
          setActiveMedia(resolveMediaSource(data.images[0]));
        }
      } catch (error) {
        console.error("Failed to load property details:", error);
        // Load fallback mock data for UI visualization if API is unreachable
        setProperty(fallbackProperty);
        setActiveMedia(resolveMediaSource(fallbackProperty.images[0]));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] flex flex-col items-center justify-center text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p className="text-sm font-bold tracking-widest uppercase">Loading Property</p>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] font-sans pb-24 text-[#141414] dark:text-white">
      
      {/* Public Minimal Header */}
      <header className="bg-white dark:bg-[#141414] border-b border-gray-300 dark:border-gray-800 sticky top-0 z-40">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/properties" className="cursor-pointer flex items-center gap-2 group text-gray-500 dark:text-gray-400 hover:text-[#141414] dark:hover:text-white transition-colors">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Back to Listings</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-6 h-6 object-contain" />
            <h1 className="font-display text-lg font-bold text-[#141414] dark:text-white tracking-tight">MAKAO</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Media Gallery Section */}
        <div className="bg-white dark:bg-[#141414] rounded-[1rem] border border-gray-300 dark:border-gray-800 overflow-hidden shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row h-auto lg:h-[600px]">
            {/* Main Display Viewer */}
            <div className="flex-1 bg-gray-100 dark:bg-black relative">
              {activeMedia && (activeMedia.includes("video") || activeMedia.includes("mp4")) ? (
                <div className="w-full h-full flex items-center justify-center bg-black text-white relative group">
                  <video src={activeMedia} controls className="w-full h-full object-cover" />
                </div>
              ) : (
                <img 
                  src={activeMedia || "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200"} 
                  alt="Property View" 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>

            {/* Thumbnail Sidebar */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-300 dark:border-gray-800 bg-white dark:bg-[#141414] p-4 overflow-y-auto flex flex-row lg:flex-col gap-3 custom-scrollbar">
              <h3 className="hidden lg:block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">Media Gallery</h3>
              {property.images?.map((media: any, index: number) => {
                const mediaSource = resolveMediaSource(media);
                return (
                  <button
                    key={index}
                    onClick={() => setActiveMedia(mediaSource)}
                    className={cn(
                      "cursor-pointer relative w-24 lg:w-full h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                      activeMedia === mediaSource 
                        ? "border-[#141414] dark:border-white" 
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={mediaSource} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    {media.type === "video" && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play size={16} className="text-white fill-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Property Details */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-gray-100 dark:bg-[#2A2A2A] text-[#141414] dark:text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {property.type || "For Sale"}
                </span>
                <span className="px-3 py-1 border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {property.status || "Active"}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#141414] dark:text-white leading-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-4">
                <MapPin size={18} />
                <span className="text-sm font-medium">{property.address || property.location}</span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="flex flex-wrap gap-4 py-6 border-y border-gray-300 dark:border-gray-800">
              <div className="flex items-center gap-3 pr-6 border-r border-gray-300 dark:border-gray-800">
                <BedDouble size={24} className="text-gray-400" />
                <div>
                  <p className="text-2xl font-bold text-[#141414] dark:text-white">{property.bedrooms}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Bedrooms</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pr-6 border-r border-gray-300 dark:border-gray-800">
                <Bath size={24} className="text-gray-400" />
                <div>
                  {/* FIX: Map directly to property.baths to align with the server payload */}
                  <p className="text-2xl font-bold text-[#141414] dark:text-white">{property.baths ?? property.bathrooms ?? "-"}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Bathrooms</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Square size={24} className="text-gray-400" />
                <div>
                  <p className="text-2xl font-bold text-[#141414] dark:text-white">{property.sqft?.toLocaleString() || "N/A"}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Square Feet</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-bold text-[#141414] dark:text-white mb-4">Property Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities Grid */}
            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-[#141414] dark:text-white mb-4">Amenities & Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                  {property.amenities.map((amenity: string, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#1A1A1A] flex items-center justify-center shrink-0">
                        <Check size={12} className="text-[#141414] dark:text-white" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Listed Price</p>
              <h2 className="text-4xl sm:text-5xl font-black text-[#141414] dark:text-white tracking-tight mb-8">
                {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(property.price)}
              </h2>

              <div className="space-y-4">
                <button 
                  type="button"
                  onClick={() => navigate(`/properties/${id}/offer`)}
                  className="cursor-pointer w-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] flex items-center justify-between px-6 py-4 rounded-xl font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Make an Offer</span>
                  <ChevronRight size={18} />
                </button>

                <button 
                  type="button"
                  className="cursor-pointer w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-800 text-[#141414] dark:text-white flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-[#111111] transition-colors"
                >
                  <Camera size={18} />
                  <span>Request Viewing</span>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-900">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Listing Agency</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-black rounded-full flex items-center justify-center font-bold text-[#141414] dark:text-white">
                    {property.agency?.name?.[0] || "A"}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#141414] dark:text-white">{property.agency?.name || "Makao Premium Partners"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Verified Operator</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// --- MOCK FALLBACK DATA ---
const fallbackProperty = {
  id: "prop-123",
  title: "Modern Architectural Villa in Runda",
  price: 85000000,
  address: "123 Runda Estate, Nairobi, Kenya",
  type: "For Sale",
  status: "Active",
  bedrooms: 5,
  bathrooms: 6,
  sqft: 6500,
  description: "Experience unparalleled luxury in this modern architectural masterpiece located in the heart of Runda. This property features floor-to-ceiling windows, a state-of-the-art smart home system, a private infinity pool, and an expansive manicured garden.\n\nDesigned for both grand entertaining and intimate family living, the open-concept layout flows seamlessly from the gourmet chef's kitchen to the sun-drenched living areas.",
  amenities: [
    "Smart Home Integration", "Infinity Pool", "Gourmet Kitchen", 
    "Home Theater", "Staff Quarters", "24/7 Security", 
    "Solar Heating", "Borehole Water"
  ],
  images: [
    { url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200", type: "image" },
    { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200", type: "image" },
    { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200", type: "image" },
    { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200", type: "image" },
  ],
  agency: { name: "Elite Homes Kenya" }
};