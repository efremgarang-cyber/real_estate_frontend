import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Search, SlidersHorizontal, MapPin, BedDouble, 
  Bath, Square, ChevronRight, Loader2, Building2 
} from "lucide-react";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { PageTour } from "../../components/chat/PageTour";
import { AssistantWidget } from "../../components/chat/AssistantWidget";

export const PublicListings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minBedrooms, setMinBedrooms] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch unified properties index
  useEffect(() => {
    const fetchAllListings = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/properties");
        const data = response.data?.data || response.data;
        setProperties(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to sync multi-agency listings index:", error);
        setProperties(fallbackPropertiesIndex);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllListings();
  }, []);

  const filteredProperties = properties.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (item.title?.toLowerCase() || "").includes(searchLower) ||
      (item.location?.toLowerCase() || "").includes(searchLower) ||
      (item.city?.toLowerCase() || "").includes(searchLower);
      
    const matchesType = selectedType === "All" || item.status === selectedType;
    const matchesPrice = !maxPrice || Number(item.price) <= Number(maxPrice);
    const matchesBeds = !minBedrooms || Number(item.bedrooms) >= Number(minBedrooms);

    return matchesSearch && matchesType && matchesPrice && matchesBeds;
  });

  const resolvePropertyImage = (property: any): string => {
    const fallbackImage = "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=600";
    if (!property.images || property.images.length === 0) return fallbackImage;
    
    const firstImage = property.images[0];
    const rawUrl = firstImage.signed_url || firstImage.s3_path || firstImage.url;
    if (!rawUrl) return fallbackImage;
    if (rawUrl.startsWith('http')) return rawUrl;

    const { data } = supabase.storage.from('user-files').getPublicUrl(rawUrl);
    return data.publicUrl || fallbackImage;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] font-sans pb-24 text-[#141414] dark:text-white">
      
      {/* --- INTEGRATED COMPONENTS --- */}
      <PageTour 
        id="public-listings" 
        title="Unified Search" 
        desc="Use these filters to explore our multi-agency exchange." 
      />
      
      <header className="bg-white dark:bg-[#141414] border-b border-gray-300 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={"/"} className="cursor-pointer flex items-center gap-2">
            <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-6 h-6 object-contain" />
            <span className="font-display text-lg font-bold tracking-tight">MAKAO</span>
          </Link>
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Unified Public Exchange
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <h1 className="text-4xl sm:text-5xl font-black text-[#141414] dark:text-white tracking-tight leading-none">
          Explore Ecosystem Listings
        </h1>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {/* Filter UI */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search by city, neighborhood, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm font-medium text-[#141414] dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn("cursor-pointer flex items-center gap-2 px-5 py-3 border rounded-xl font-bold text-sm transition-colors", showFilters ? "bg-[#141414] dark:bg-white text-white dark:text-[#141414] border-transparent" : "bg-white dark:bg-[#141414] border-gray-300 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50")}
              >
                <SlidersHorizontal size={16} />
                <span>Filters</span>
              </button>
              <select
                title="Property Allocation Type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="cursor-pointer px-4 py-3 bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active listings</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="p-6 bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label htmlFor="maxPrice" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Maximum Budget (KES)</label>
                <input id="maxPrice" type="number" placeholder="e.g. 100000000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none text-sm text-[#141414] dark:text-white" />
              </div>
              <div>
                <label htmlFor="minBeds" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Minimum Bedrooms</label>
                <select id="minBeds" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} className="cursor-pointer w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none text-sm text-gray-700 dark:text-gray-200 font-medium">
                  <option value="">Any Count</option>
                  <option value="1">1+ Beds</option>
                  <option value="2">2+ Beds</option>
                  <option value="3">3+ Beds</option>
                  <option value="4">4+ Beds</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <Loader2 size={28} className="animate-spin mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">Hydrating Index</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-gray-300 dark:border-gray-800 rounded-[2rem] bg-white dark:bg-[#141414]">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">No Properties Found Match Criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
            {filteredProperties.map((property) => (
              <div 
                key={property.id}
                onClick={() => navigate(`/properties/${property.id}`)}
                className="cursor-pointer bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 rounded-[1rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.01)] group hover:shadow-[0_20px_40px_rgba(0,0,0,0.02)] transition-all flex flex-col h-full"
              >
                <div className="h-56 bg-gray-100 dark:bg-black relative overflow-hidden shrink-0">
                  <img src={resolvePropertyImage(property)} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 flex gap-1.5">
                    <span className="px-2.5 py-0.5 bg-[#141414]/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest rounded-md">{property.status}</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex-1">
                    <p className="text-xl font-black text-[#141414] dark:text-white tracking-tight mb-1">
                      {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(property.price)}
                    </p>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-1 leading-snug">{property.title}</h3>
                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mt-2 mb-4">
                      <MapPin size={14} className="shrink-0" />
                      <span className="text-xs font-medium truncate">{property.location}, {property.city}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-4 border-t border-gray-100 dark:border-gray-900 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <BedDouble size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{property.bedrooms} Beds</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bath size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{property.baths} Baths</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Square size={12} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate">{property.sqft || "—"} Sqft</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-50 dark:border-gray-900 flex items-center justify-between mt-auto text-gray-400 dark:text-gray-500 shrink-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 size={12} className="shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate">{property.agency?.name || "Independent Network"}</span>
                    </div>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- INTEGRATED ASSISTANT --- */}
      <AssistantWidget contextData={filteredProperties} />
      
    </div>
  );
};

const fallbackPropertiesIndex = [
  {
    id: "prop-1",
    title: "Modern Architectural Villa in Runda",
    price: 85000000,
    location: "Runda Estate",
    city: "Nairobi",
    status: "active",
    bedrooms: 5,
    baths: 6,
    sqft: 6500,
    images: [{ s3_path: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=600" }],
    agency: { name: "Elite Homes Kenya" }
  },
  {
    id: "prop-2",
    title: "Minimalist Penthouse Overlooking Westlands",
    price: 35000000,
    location: "Westlands Area",
    city: "Nairobi",
    status: "active",
    bedrooms: 3,
    baths: 4,
    sqft: 3200,
    images: [{ s3_path: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=600" }],
    agency: { name: "Vantage Realty Partners" }
  }
];