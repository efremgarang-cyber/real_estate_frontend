import React, { useState, useEffect } from "react";
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
import { formatCurrency, cn } from "../../lib/utils";
import { propertyApi } from "../../api/properties"; 
import { AnimatePresence } from "motion/react";
import { NewListingModal } from "../../components/NewListingModal";

export const PropertiesPage: React.FC = () => {
  const [view, setView] = useState<"grid" | "list">("grid");
  
  // Asynchronous State Management
  const [properties, setProperties] = useState<any[]>([]); // Replace 'any' with your Property type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pagination State (ready to be wired up to UI buttons if needed)
  const [page, setPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [triggerRefresh, setTriggerRefresh] = useState(0);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await propertyApi.getAll(page);
        console.log(response.data);
        // Laravel paginated responses typically nest the array inside a 'data' property.
        // E.g., response = { current_page: 1, data: [...properties], last_page: 5 }
        // Adjust this extraction based on your exact PAGINATED_RESPONSE interface.
        const items = response.data || []; 
        setProperties(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setError("Unable to load the property portfolio. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [page, triggerRefresh]);

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search listings..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button title="grid"
              onClick={() => setView("grid")}
              className={cn("p-2 rounded-lg transition-colors", view === "grid" ? "bg-gray-100 text-[#141414]" : "text-gray-400 hover:text-gray-600")}
            >
              <LayoutGrid size={18} />
            </button>
            <button title="list"
              onClick={() => setView("list")}
              className={cn("p-2 rounded-lg transition-colors", view === "list" ? "bg-gray-100 text-[#141414]" : "text-gray-400 hover:text-gray-600")}
            >
              <List size={18} />
            </button>
          </div>
          <button 
            onClick={() => setShowUploadModal(true)} 
            className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white px-5 py-3 rounded-xl font-medium transition-colors text-sm shadow-sm"
          >
            <Plus size={16} /> New Listing
          </button>
        </div>
      </div>

      {/* Network States */}
      {isLoading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 size={32} className="animate-spin text-[#141414]" />
          <p className="text-sm font-medium text-gray-500">Loading properties...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-[2rem] border border-red-100 shadow-sm">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button 
            onClick={() => setPage(page)} // Retrigger the effect
            className="px-6 py-2.5 bg-gray-100 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && properties.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <Search size={24} />
          </div>
          <h3 className="font-display text-lg font-bold text-[#141414] mb-2">No properties found</h3>
          <p className="text-sm text-gray-500">Your portfolio is currently empty. Click 'New Listing' to get started.</p>
        </div>
      )}

      {/* Main Grid/List View */}
      {!isLoading && !error && properties.length > 0 && (
        <div className={cn(
          "grid gap-6",
          view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {properties.map((property) => {
            // Safe extraction handling potential backend variations
            const mainImage = property.images?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800";
            const expiration = property.contract_end_date || property.expirationDate || "Not set";
            const isActive = property.status === "active" || property.status === "Active";

            return (
              <Link 
                key={property.id} 
                to={`/properties/${property.id}`}
                className={cn(
                  "bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all p-5 flex flex-col group",
                  view === "list" && "md:flex-row md:items-center md:gap-8"
                )}
              >
                <div className={cn(
                  "relative bg-gray-100 overflow-hidden rounded-2xl shrink-0",
                  view === "list" ? "md:w-64 md:aspect-square" : "w-full aspect-video mb-5"
                )}>
                  <img 
                    src={mainImage}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt={property.title}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between h-full">
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-display text-lg font-bold text-[#141414] leading-tight">
                        {property.title}
                      </h4>
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        isActive ? "text-green-600" : "text-gray-400"
                      )}>
                        {property.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                      <MapPin size={14} /> {property.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6 pt-4 border-t border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Beds</span>
                      <div className="flex items-center gap-1.5 font-bold text-[#141414]">
                        <Bed size={16} className="text-gray-400" /> {property.bedrooms || "-"}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Baths</span>
                      <div className="flex items-center gap-1.5 font-bold text-[#141414]">
                        <Bath size={16} className="text-gray-400" /> {property.baths || "-"}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Area</span>
                      <div className="flex items-center gap-1.5 font-bold text-[#141414] whitespace-nowrap">
                        <Maximize2 size={16} className="text-gray-400" /> {property.sqft ? property.sqft.toLocaleString() : "-"} <span className="text-[10px] font-medium text-gray-500">SQFT</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Asking Price</p>
                      <p className="text-xl font-bold text-[#141414]">{formatCurrency(property.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Calendar size={14} /> Expires: {expiration}
                    </div>
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
            onSuccess={() => {
              setShowUploadModal(false);
              setTriggerRefresh(prev => prev + 1); // Automatically pulls updated DB baseline state
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};