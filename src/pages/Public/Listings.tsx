import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Search, SlidersHorizontal, MapPin, BedDouble, 
  Bath, Square, ChevronRight, Loader2, Check, LayoutGrid, List
} from "lucide-react";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";

export const PublicListings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<string>("150000000"); // Default high value for slider
  const [minBedrooms, setMinBedrooms] = useState<string>("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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

  // ACTIVE FILTERING LOGIC
  const filteredProperties = properties.filter((item) => {
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = 
      (item.title?.toLowerCase() || "").includes(searchLower) ||
      (item.location?.toLowerCase() || "").includes(searchLower) ||
      (item.city?.toLowerCase() || "").includes(searchLower);
      
    // Added case-insensitive matching so "Active" matches "active"
    const matchesType = selectedType === "All" || (item.status || "").toLowerCase() === selectedType.toLowerCase();
    
    const matchesPrice = !maxPrice || Number(item.price) <= Number(maxPrice);
    const matchesBeds = !minBedrooms || Number(item.bedrooms) >= Number(minBedrooms);

    return matchesSearch && matchesType && matchesPrice && matchesBeds;
  });

  // Handle both the new Object format and legacy arrays
  const resolvePropertyImage = (property: any): string => {
    const fallbackImage = "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=600";
    
    if (!property.images) return fallbackImage;

    let rawUrl = null;

    if (typeof property.images === 'object' && !Array.isArray(property.images)) {
      rawUrl = property.images.main || (property.images.interior && property.images.interior[0]) || null;
    } else if (Array.isArray(property.images) && property.images.length > 0) {
      const firstImage = property.images[0];
      rawUrl = typeof firstImage === 'string' ? firstImage : (firstImage.signed_url || firstImage.s3_path || firstImage.url);
    }

    if (!rawUrl) return fallbackImage;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) return rawUrl;

    const { data } = supabase.storage.from('user-files').getPublicUrl(rawUrl);
    return data.publicUrl || fallbackImage;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] font-sans pb-24 text-[#141414] dark:text-white">
      
      {/* Navbar */}
      <header className="fixed w-full top-0 z-50 bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={"/"} className="cursor-pointer flex items-center gap-2">
            <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-6 h-6 object-contain" />
            <span className="font-display text-lg font-bold tracking-tight text-white">MAKAO</span>
          </Link>
          <div className="hidden md:flex gap-8 text-xs font-bold text-gray-300 uppercase tracking-widest">
            <span className="cursor-pointer hover:text-[#D4AF37] transition-colors">Buy</span>
            <span className="cursor-pointer hover:text-[#D4AF37] transition-colors">Rent</span>
            <span className="cursor-pointer hover:text-[#D4AF37] transition-colors">Agencies</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative sm:h-80 lg:h-[400px] w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=2000" 
          alt="Premium Architecture" 
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/90 via-[#141414]/40 to-transparent flex items-end pb-12">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-[1640px]">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg">
              Makao Property Listings
            </h1>
            <p className="text-[#D4AF37] font-semibold mt-2 tracking-wide uppercase text-sm drop-shadow-md">
              Buy your dream home today.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 lg:mt-12 flex flex-col lg:flex-row gap-10">
        
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="flex items-center gap-2 text-sm font-bold text-[#141414] dark:text-white"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          <span className="text-xs font-bold text-gray-400">{filteredProperties.length} listings</span>
        </div>

        {/* LEFT SIDEBAR: FILTERS */}
        <aside className={cn(
          "w-full lg:w-64 shrink-0 space-y-8 transition-all duration-300",
          isMobileFiltersOpen ? "block" : "hidden lg:block"
        )}>
          
          {/* Keyword Search */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              Search
            </h3>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input 
                type="text"
                placeholder="City, Area, Title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#111] border-none rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-sm text-[#141414] dark:text-white"
              />
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] dark:text-white">Price</h3>
              <button onClick={() => setMaxPrice("150000000")} className="text-[10px] text-gray-400 hover:text-[#D4AF37] cursor-pointer">Reset</button>
            </div>
            <input 
              type="range" 
              min="0" 
              max="200000000" 
              step="1000000"
              value={maxPrice} 
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full accent-[#D4AF37] appearance-none bg-gray-200 dark:bg-gray-800 h-1 rounded-full outline-none slider-thumb-gold cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-3 font-medium">
              Up to <span className="text-[#141414] dark:text-white font-bold">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(maxPrice))}</span>
            </p>
          </div>

          {/* Status / Availability */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] dark:text-white mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              Availability
            </h3>
            <div className="space-y-3">
              {['All', 'active', 'pending'].map((type) => (
                <label 
                  key={type} 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setSelectedType(type)} // <--- FIX: Added onClick to trigger state change
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    selectedType === type ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-300 dark:border-gray-700 group-hover:border-[#D4AF37]"
                  )}>
                    {selectedType === type && <Check size={10} className="text-white" />}
                  </div>
                  <span className={cn("text-sm font-medium", selectedType === type ? "text-[#141414] dark:text-white" : "text-gray-500")}>
                    {type === 'All' ? 'All Statuses' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Bedrooms / Size */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] dark:text-white">Bedrooms</h3>
              <button onClick={() => setMinBedrooms("")} className="text-[10px] text-gray-400 hover:text-[#D4AF37] cursor-pointer">Reset</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Any Size', value: '' },
                { label: '2+ Bedrooms', value: '2' },
                { label: '3+ Bedrooms', value: '3' },
                { label: '4+ Bedrooms', value: '4' },
                { label: '5+ Bedrooms', value: '5' }
              ].map((bed) => (
                <label 
                  key={bed.label} 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setMinBedrooms(bed.value)} // <--- FIX: Added onClick to trigger state change
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    minBedrooms === bed.value ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-300 dark:border-gray-700 group-hover:border-[#D4AF37]"
                  )}>
                    {minBedrooms === bed.value && <Check size={10} className="text-white" />}
                  </div>
                  <span className={cn("text-sm font-medium", minBedrooms === bed.value ? "text-[#141414] dark:text-white" : "text-gray-500")}>
                    {bed.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT: GRID */}
        <div className="flex-1">
          
          {/* Top Control Bar */}
          <div className="hidden lg:flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {filteredProperties.length} Products
            </span>
            <div className="flex items-center gap-4 text-gray-400">
              <span className="text-xs font-bold uppercase tracking-widest mr-2">Sort By</span>
              <select className="bg-transparent text-sm font-bold text-[#141414] dark:text-white focus:outline-none cursor-pointer">
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest Arrivals</option>
              </select>
              <div className="flex items-center gap-2 ml-4 border-l border-gray-200 dark:border-gray-800 pl-4">
                <LayoutGrid size={16} className="text-[#D4AF37] cursor-pointer" />
                <List size={16} className="hover:text-[#141414] dark:hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>
          </div>

          {/* Grid Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
              <Loader2 size={28} className="animate-spin mb-3 text-[#D4AF37]" />
              <p className="text-xs font-bold uppercase tracking-widest">Loading Collection</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">No matches found</p>
              <button onClick={() => {setMaxPrice("150000000"); setMinBedrooms(""); setSelectedType("All"); setSearchQuery("");}} className="mt-4 text-sm font-bold text-[#D4AF37] hover:underline cursor-pointer">Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
              {filteredProperties.map((property) => (
                <div 
                  key={property.id}
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="cursor-pointer group flex flex-col h-full"
                >
                  {/* Clean, Sharp Image (Plantitude Style) */}
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-[#111] relative overflow-hidden shrink-0 mb-4 rounded-xl">
                    <img 
                      src={resolvePropertyImage(property)} 
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    />
                    {(property.status || "").toLowerCase() === 'active' && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-[#D4AF37] text-white text-[9px] font-black uppercase tracking-widest rounded shadow-sm">
                          Active
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Minimalist Info Payload */}
                  <div className="flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-[#141414] dark:text-gray-100 line-clamp-1 group-hover:text-[#D4AF37] transition-colors uppercase tracking-wide">
                      {property.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-1 mb-3">
                      <p className="text-sm font-black text-[#D4AF37] tracking-tight">
                        {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(property.price)}
                      </p>
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <MapPin size={12} />
                        <span className="truncate max-w-[100px]">{property.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 mt-auto">
                      <div className="flex items-center gap-1.5">
                        <BedDouble size={14} />
                        <span className="text-xs font-semibold">{property.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath size={14} />
                        <span className="text-xs font-semibold">{property.baths ?? property.bathrooms ?? "-"} Baths</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Square size={12} />
                        <span className="text-xs font-semibold">{property.sqft || "—"} Sqft</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Simple Pagination Footer */}
          {!isLoading && filteredProperties.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-16 pt-8 border-t border-gray-100 dark:border-gray-900">
              <button className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-[#141414] text-white dark:bg-white dark:text-[#141414] text-xs font-bold">1</button>
              <button className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#141414] dark:hover:text-white text-xs font-bold transition-colors">2</button>
              <span className="text-gray-400">...</span>
              <button className="cursor-pointer flex items-center gap-1 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#141414] dark:text-white hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-colors">
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* --- INTEGRATED ASSISTANT --- */}
      <AssistantWidget contextData={filteredProperties} />
      
    </div>
  );
};

const AssistantWidget = ({ contextData }: { contextData: any[] }) => {
  return null;
};

const fallbackPropertiesIndex = [
  {
    id: "prop-1",
    title: "Architectural Villa",
    price: 85000000,
    location: "Runda",
    city: "Nairobi",
    status: "active",
    bedrooms: 5,
    baths: 6,
    sqft: 6500,
    images: { main: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=600" },
    agency: { name: "Elite Homes" }
  },
  {
    id: "prop-2",
    title: "Minimalist Penthouse",
    price: 35000000,
    location: "Westlands",
    city: "Nairobi",
    status: "active",
    bedrooms: 3,
    baths: 4,
    sqft: 3200,
    images: { main: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=600" },
    agency: { name: "Vantage Realty" }
  },
  {
    id: "prop-3",
    title: "Serene Garden Estate",
    price: 120000000,
    location: "Karen",
    city: "Nairobi",
    status: "active",
    bedrooms: 6,
    baths: 6,
    sqft: 8500,
    images: { main: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600" },
    agency: { name: "Karen Estates" }
  }
];