// src/pages/Admin/properties/AdminListings.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Grid, List, Plus, MapPin, Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency, cn } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties";
import { vaultApi } from "../../../api/vault";
import { AdminNewListing } from "./AdminNewListing"; // Import the modal popup component

export const AdminListings: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // State hook to govern overlay visibility parameters
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetches every property listing registered on the platform globally
  const { data: properties = [], isLoading, isError } = useQuery({
    queryKey: ["adminGlobalListingsGrid"],
    queryFn: async () => {
      const response = await propertyApi.getAll(1); 
      const items = response.data || [];

      return await Promise.all(
        items.map(async (item: any) => {
          let rawUrl = item?.images?.[0];
          if (typeof rawUrl === "object") rawUrl = rawUrl.s3_path || rawUrl.url;

          let signedImage = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200";
          if (rawUrl) {
            try {
              signedImage = await vaultApi.getSignedUrl(rawUrl);
            } catch (err) {
              console.error("MinIO image resolution error:", err);
            }
          }
          return { ...item, _signedImage: signedImage };
        })
      );
    }
  });

  const filteredProperties = properties.filter((p: any) =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full font-sans text-[#141414] space-y-6">
      
      {/* ── HEADER TITLE AREA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Properties</h1>
          <p className="text-xs text-gray-500 mt-0.5">Welcome back, John</p>
        </div>
        
        {/* Click events directly pop open the new container dialog */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Plus size={15} /> New Listing
        </button>
      </div>

      {/* ── SEARCH & SWITCH CONTROLS ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings by title, county or neighborhood..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-4 py-2.5 bg-white border border-neutral-200/80 rounded-xl text-sm w-full focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200/40">
          <button 
            onClick={() => setViewMode("grid")}
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-neutral-600")}
          >
            <Grid size={16} />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-neutral-600")}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── LISTINGS CORE MATRIX RENDERER ── */}
      {isLoading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 bg-white border border-neutral-200/60 rounded-[2rem]">
          <Loader2 size={26} className="animate-spin text-neutral-800" />
          <p className="text-xs text-gray-400">Syncing platform listing shards...</p>
        </div>
      )}

      {isError && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white rounded-[2rem] border border-neutral-200/60 p-6 text-center">
          <AlertTriangle size={32} className="text-red-500 mb-2" />
          <p className="text-xs font-semibold text-neutral-700">Database Stream Interrupted</p>
        </div>
      )}

      {!isLoading && !isError && filteredProperties.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white border border-neutral-200/60 rounded-[2rem] p-8 text-center">
          <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100 mb-4">
            <Search size={18} className="text-neutral-300" />
          </div>
          <h3 className="font-bold text-neutral-800 text-sm">No properties matched criteria</h3>
          <p className="text-xs text-neutral-400 max-w-xs mt-1">Modify your active string parameters or construct a clean listing framework file.</p>
        </div>
      )}

      {!isLoading && !isError && filteredProperties.length > 0 && (
        <div className={cn(
          viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"
        )}>
          {filteredProperties.map((item: any) => (
            <div
              key={item.id}
              onClick={() => navigate(`/admin/properties/${item.id}`)}
              className={cn(
                "bg-white border border-neutral-200/60 rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] transition-all cursor-pointer group",
                viewMode === "list" && "flex items-center gap-6 p-4"
              )}
            >
              <div className={cn(
                "bg-neutral-100 overflow-hidden relative shrink-0",
                viewMode === "grid" ? "aspect-[4/3] w-full" : "w-36 h-24 rounded-2xl"
              )}>
                <img src={item._signedImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-neutral-800">
                  {item.status || "Active"}
                </span>
              </div>

              <div className={cn("p-6", viewMode === "list" && "p-0 flex-1")}>
                <h3 className="font-bold text-base text-neutral-900 tracking-tight line-clamp-1">{item.title}</h3>
                <div className="flex items-center gap-1 text-xs text-neutral-400 mt-1 font-medium">
                  <MapPin size={12} />
                  <span>{item.location || "Nairobi, Kenya"}</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-neutral-100 mt-4 pt-3">
                  <span className="text-sm font-black text-neutral-900 tracking-tight">
                    {formatCurrency(item.price || 0)}
                  </span>
                  {item.agency && (
                    <span className="text-[10px] font-mono font-bold bg-neutral-50 px-2.5 py-0.5 rounded border border-neutral-100 text-neutral-500">
                      {item.agency.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mounting the active dialog handler overlay onto the template tree */}
      <AdminNewListing 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};