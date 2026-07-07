import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, BedDouble, Bath, Square, 
  Camera, Play, Loader2, Share2 
} from "lucide-react";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api"; 
import { supabase } from "../../lib/supabase"; 
import { Property, PropertyImage } from "../../types"; // Adjust path to your types file

export const PublicPropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [activeMedia, setActiveMedia] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const resolveMediaSource = (media: string | PropertyImage | any): string => {
    if (!media) return "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200";
    const rawUrl = typeof media === 'string' ? media : (media.s3_path || media.signed_url || media.url);
    if (!rawUrl) return "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200";
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) return rawUrl;
    const { data } = supabase.storage.from('user-files').getPublicUrl(rawUrl);
    return data.publicUrl;
  };

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/properties/${id}`);
        const data: Property = response.data?.data || response.data;
        console.log("Property: ", data);
        setProperty(data);
        
        let rawImages: any = data?.images || [];
        let allImages: any[] = [];
        
        if (Array.isArray(rawImages)) {
          allImages = rawImages;
        } else if (rawImages !== null && typeof rawImages === 'object') {
          if (rawImages.main) allImages.push(rawImages.main);
          if (Array.isArray(rawImages.interior)) allImages.push(...rawImages.interior);
          if (Array.isArray(rawImages.exterior)) allImages.push(...rawImages.exterior);
        }

        const processedUrls = allImages.map(resolveMediaSource).filter(Boolean);
        const imagesToDisplay = processedUrls.length > 0 
          ? processedUrls 
          : ["https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200"];

        setGalleryImages(imagesToDisplay);
        setActiveMedia(imagesToDisplay[0]);

        const allPropsRes = await api.get("/properties");
        const allProps: Property[] = allPropsRes.data?.data || allPropsRes.data;
        
        setSimilarProperties((Array.isArray(allProps) ? allProps : fallbackSimilarProperties as unknown as Property[])
          .filter(p => String(p.id) !== id)
          .slice(0, 4));

      } catch (error) {
        console.error("Failed to load property details:", error);
        setProperty(fallbackProperty as unknown as Property);
        setSimilarProperties(fallbackSimilarProperties as unknown as Property[]);
        const fallbackUrls = fallbackProperty.images.map(resolveMediaSource);
        setGalleryImages(fallbackUrls);
        setActiveMedia(fallbackUrls[0]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPropertyData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-center text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4 text-[#D4AF37]" />
        <p className="text-sm font-bold tracking-widest uppercase">Loading Listing</p>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] font-sans pb-24 text-[#141414] dark:text-white">
      <header className="bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-900 sticky top-0 z-40">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/properties" className="cursor-pointer flex items-center gap-2 group text-gray-500 dark:text-gray-400 hover:text-[#D4AF37] transition-colors">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Back</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-6 h-6 object-contain" />
            <h1 className="font-display text-lg font-bold text-[#141414] dark:text-white tracking-tight">MAKAO</h1>
          </Link>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 lg:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-gray-50 dark:bg-[#111] rounded-2xl overflow-hidden relative">
              {activeMedia && (activeMedia.includes("video") || activeMedia.includes("mp4")) ? (
                <div className="w-full h-full flex items-center justify-center bg-black text-white relative">
                  <video src={activeMedia} controls className="w-full h-full object-cover" />
                </div>
              ) : (
                <img 
                  src={activeMedia} 
                  alt="Property View" 
                  className="w-full h-full object-cover" 
                />
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {galleryImages.map((mediaSource: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setActiveMedia(mediaSource)}
                    className={cn(
                      "cursor-pointer relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                      activeMedia === mediaSource 
                        ? "border-[#D4AF37]" 
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={mediaSource} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    {(mediaSource.includes("video") || mediaSource.includes("mp4")) && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play size={16} className="text-white fill-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="border-b border-gray-100 dark:border-gray-900 pb-6 mb-6">
              <p className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase mb-2">
                {property.location}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#141414] dark:text-white leading-tight mb-4 tracking-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(property.price))}
                </h2>
                {property.status?.toLowerCase() === 'active' && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">
                    In Stock
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-[#111] p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <BedDouble size={20} className="text-[#D4AF37] mb-2" />
                <span className="text-lg font-bold text-[#141414] dark:text-white">{property.bedrooms || "-"}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Beds</span>
              </div>
              <div className="bg-gray-50 dark:bg-[#111] p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <Bath size={20} className="text-[#D4AF37] mb-2" />
                <span className="text-lg font-bold text-[#141414] dark:text-white">{property.baths ?? "-"}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Baths</span>
              </div>
              <div className="bg-gray-50 dark:bg-[#111] p-4 rounded-xl flex flex-col items-center justify-center text-center">
                <Square size={20} className="text-[#D4AF37] mb-2" />
                <span className="text-lg font-bold text-[#141414] dark:text-white">{property.sqft?.toLocaleString() || "-"}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Sqft</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <button 
                onClick={() => navigate(`/properties/${id}/offer`)}
                className="cursor-pointer w-full bg-[#141414] hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-[#141414] flex items-center justify-center gap-2 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
              >
                <span>Make an Offer</span>
              </button>
              <div className="flex gap-3">
                <button className="cursor-pointer flex-1 bg-white dark:bg-[#141414] border-2 border-gray-200 dark:border-gray-800 text-[#141414] dark:text-white flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors">
                  <Camera size={16} /> Request Viewing
                </button>
                <button className="cursor-pointer w-14 flex items-center justify-center bg-gray-50 dark:bg-[#111] rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                  <Share2 size={16} className="text-[#141414] dark:text-white" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-900 pt-6">
              <h3 className="text-xs font-bold text-[#141414] dark:text-white uppercase tracking-widest mb-4">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-900 pt-6 mt-6">
                <h3 className="text-xs font-bold text-[#141414] dark:text-white uppercase tracking-widest mb-4">Features</h3>
                <ul className="grid grid-cols-2 gap-3">
                  {property.amenities.map((amenity: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-auto pt-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center text-xs font-bold text-[#141414] dark:text-white">
                {property.agency?.name?.[0] || "A"}
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                Listed by <span className="text-[#141414] dark:text-white">{property.agency?.name || "Makao Partners"}</span>
              </p>
            </div>

          </div>
        </div>

        {similarProperties.length > 0 && (
          <div className="mt-24 pt-16 border-t border-gray-100 dark:border-gray-900">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-[#141414] dark:text-white tracking-tight">Similar Properties</h3>
              <Link to="/properties" className="text-sm font-bold text-[#D4AF37] hover:underline uppercase tracking-widest hidden sm:block">View All</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProperties.map((simProp) => {
                let simMainImg = null;
                if (Array.isArray(simProp.images)) {
                  simMainImg = simProp.images[0];
                } else if (simProp.images && typeof simProp.images === 'object') {
                  simMainImg = (simProp.images as any).main;
                }
                
                return (
                  <div 
                    key={simProp.id}
                    onClick={() => navigate(`/properties/${simProp.id}`)}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-[4/3] bg-gray-100 dark:bg-[#111] relative overflow-hidden rounded-xl mb-4">
                      <img 
                        src={resolveMediaSource(simMainImg)} 
                        alt={simProp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                      />
                    </div>
                    <h4 className="text-sm font-bold text-[#141414] dark:text-gray-100 line-clamp-1 group-hover:text-[#D4AF37] transition-colors uppercase tracking-wide">
                      {simProp.title}
                    </h4>
                    <p className="text-sm font-black text-[#D4AF37] tracking-tight mt-1">
                      {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(simProp.price))}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- MOCK FALLBACK DATA ---
const fallbackProperty = {
  id: 123,
  title: "Modern Architectural Villa",
  price: "85000000",
  location: "Runda",
  status: "Active",
  bedrooms: 5,
  baths: 6,
  sqft: 6500,
  description: "Experience unparalleled luxury in this modern architectural masterpiece located in the heart of Runda. This property features floor-to-ceiling windows, a state-of-the-art smart home system, a private infinity pool, and an expansive manicured garden.\n\nDesigned for both grand entertaining and intimate family living, the open-concept layout flows seamlessly from the gourmet chef's kitchen to the sun-drenched living areas.",
  amenities: [
    "Smart Home Integration", "Infinity Pool", "Gourmet Kitchen", 
    "Home Theater", "Staff Quarters", "24/7 Security"
  ],
  images: [
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200"
  ],
  agency: { name: "Elite Homes Kenya" }
};

const fallbackSimilarProperties = [
  {
    id: 456,
    title: "Minimalist Penthouse",
    price: "45000000",
    images: { main: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=600" }
  },
  {
    id: 789,
    title: "Serene Garden Estate",
    price: "120000000",
    images: { main: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600" }
  }
];
