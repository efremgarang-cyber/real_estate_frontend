import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  MapPin, 
  LayoutGrid, 
  List, 
  Search,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, cn } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties"; 
import { vaultApi } from "../../../api/vault";
import { AnimatePresence } from "motion/react";
import { NewListingModal } from "../../../components/NewListingModal";

const KENYAN_PROPERTY_IMAGE_MAP: Record<string, string> = {
  kitisuru: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop", 
  muthaiga: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop", 
  milimani: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop", 
  karen: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",    
  kilimani: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop", 
  default: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop"
};

export const PropertiesPage: React.FC = () => {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. React Query implementation for caching & fetching
  const { 
    data: properties = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['properties', page],
    queryFn: async () => {
      const response = await propertyApi.getAgencyProperties(page);
      const items: any[] = response.data || [];

      return await Promise.all(
        (Array.isArray(items) ? items : []).map(async (property: any) => {
          let rawUrl: string | null = null;

          if (property?.images && Array.isArray(property.images) && property.images.length > 0) {
            const primaryImage = property.images[0];
            console.log("Primary image entry:", primaryImage);

            if (typeof primaryImage === "string") {
              rawUrl = primaryImage;
            } else if (typeof primaryImage === "object" && primaryImage !== null) {
              rawUrl = primaryImage.s3_path || primaryImage.url || primaryImage.file_path || null;
            }
          }

          console.log("Resolved rawUrl for", property.title, ":", rawUrl);

          let finalUrl = "";
          if (rawUrl) {
            finalUrl = await vaultApi.getSignedUrl(rawUrl);
            console.log("Signed URL:", finalUrl);
          } else {
            const searchString = `${property?.title || ""} ${property?.location || ""} ${property?.neighborhood || ""}`.toLowerCase();
            if (searchString.includes("kitisuru"))       finalUrl = KENYAN_PROPERTY_IMAGE_MAP.kitisuru;
            else if (searchString.includes("muthaiga") || searchString.includes("oribi")) finalUrl = KENYAN_PROPERTY_IMAGE_MAP.muthaiga;
            else if (searchString.includes("milimani"))  finalUrl = KENYAN_PROPERTY_IMAGE_MAP.milimani;
            else if (searchString.includes("karen"))     finalUrl = KENYAN_PROPERTY_IMAGE_MAP.karen;
            else if (searchString.includes("kilimani"))  finalUrl = KENYAN_PROPERTY_IMAGE_MAP.kilimani;
            else finalUrl = KENYAN_PROPERTY_IMAGE_MAP.default;
          }

          return { ...property, _signedMainImage: finalUrl };
        })
      );
    },
  });

  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;
    const normalizedQuery = searchQuery.toLowerCase();
    return properties.filter((property: any) => {
      return (
        property.title?.toLowerCase().includes(normalizedQuery) ||
        property.location?.toLowerCase().includes(normalizedQuery) ||
        property.neighborhood?.toLowerCase().includes(normalizedQuery) ||
        property.status?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [searchQuery, properties]);

  return (
    <div className="space-y-6 font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search listings by title, county or neighborhood..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm shadow-sm font-medium text-[#141414]"
          />
        </div>
        
        <div className="flex items-center gap-3 justify-between md:justify-end">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button title="Grid Layout View Selector" onClick={() => setView("grid")} className={cn("p-2 rounded-lg transition-colors", view === "grid" ? "bg-gray-100 text-[#141414]" : "text-gray-400 hover:text-gray-600")}>
              <LayoutGrid size={18} />
            </button>
            <button title="List Layout View Selector" onClick={() => setView("list")} className={cn("p-2 rounded-lg transition-colors", view === "list" ? "bg-gray-100 text-[#141414]" : "text-gray-400 hover:text-gray-600")}>
              <List size={18} />
            </button>
          </div>
          <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white px-5 py-3 rounded-xl font-medium transition-colors text-sm shadow-sm shrink-0">
            <Plus size={16} /> New Listing
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 size={32} className="animate-spin text-[#141414]" />
          <p className="text-sm font-medium text-gray-500">Syncing live property portfolio database updates...</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-[2rem] border border-red-100 shadow-sm">
          <p className="text-red-600 font-medium mb-4">Unable to load the property portfolio. Please check your connection.</p>
          <button onClick={() => refetch()} className="px-6 py-2.5 bg-gray-100 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            Re-establish Connection
          </button>
        </div>
      )}

      {!isLoading && !isError && filteredProperties.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <Search size={24} />
          </div>
          <h3 className="font-display text-lg font-bold text-[#141414] mb-2">No properties matched criteria</h3>
          <p className="text-sm text-gray-500">Modify your active string parameters or construct a clean listing framework file.</p>
        </div>
      )}

      {!isLoading && !isError && filteredProperties.length > 0 && (
        <div className={cn("grid gap-6", view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
          {filteredProperties.map((property: any) => {
            const resolvedImage = property._signedMainImage || KENYAN_PROPERTY_IMAGE_MAP.default;
            const expiration = property.contract_end_date || property.expirationDate || "Not set";
            const isActive = property.status === "active" || property.status === "Active" || property.status === "active_listing";

            return (
              <Link key={property.id} to={`/agent/properties/${property.id}`} className={cn("bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.07)] transition-all p-5 flex flex-col group border border-gray-50", view === "list" && "md:flex-row md:items-center md:gap-8")}>
                <div className={cn("relative bg-gray-100 overflow-hidden rounded-2xl shrink-0", view === "list" ? "md:w-64 md:aspect-square" : "w-full aspect-[4/3] mb-5")}>
                  <img src={resolvedImage} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" alt={property.title || "Makao Portfolio Asset Card Frame"} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = KENYAN_PROPERTY_IMAGE_MAP.default; }} />
                </div>
                <div className="flex-1 flex flex-col justify-between h-full w-full">
                  <div className="mb-5">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-display text-base font-bold text-[#141414] leading-snug group-hover:text-blue-900 transition-colors">{property.title}</h4>
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0", isActive ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-50")}>{property.status ? property.status.replace('_', ' ') : "Active"}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-400 flex items-center gap-1"><MapPin size={12} className="text-gray-400 shrink-0" /> {property.location || "Nairobi, Kenya"}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-5 pt-4 border-t border-gray-100">
                    <div className="flex flex-col"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Beds</span><div className="flex items-center gap-1 font-bold text-xs text-[#141414]"><Bed size={14} className="text-gray-400 shrink-0" /> {property.bedrooms || property.beds || "-"}</div></div>
                    <div className="flex flex-col"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Baths</span><div className="flex items-center gap-1 font-bold text-xs text-[#141414]"><Bath size={14} className="text-gray-400 shrink-0" /> {property.baths || property.bathrooms || "-"}</div></div>
                    <div className="flex flex-col"><span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Area</span><div className="flex items-center gap-1 font-bold text-xs text-[#141414] whitespace-nowrap truncate"><Maximize2 size={14} className="text-gray-400 shrink-0" /> <span>{property.sqft ? property.sqft.toLocaleString() : property.area || "-"}</span> <span className="text-[9px] font-medium text-gray-400 ml-0.5">SQFT</span></div></div>
                  </div>
                  <div className="flex items-end justify-between mt-auto pt-2">
                    <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Asking Price</p><p className="text-lg font-black text-[#141414] tracking-tight">{formatCurrency(property.price || 0)}</p></div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-xl"><Calendar size={12} className="text-gray-400" /> Exp: {expiration}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showUploadModal && (
          <NewListingModal 
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => { setShowUploadModal(false); refetch(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};