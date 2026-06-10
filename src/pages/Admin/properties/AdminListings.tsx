// src/pages/Admin/properties/AdminListings.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Grid, List, Plus, MapPin, Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency, cn } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties";
import { vaultApi } from "../../../api/vault";
import { AdminNewListing } from "./AdminNewListing";
import {api} from "../../../lib/api";

export const AdminListings: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: properties = [], isLoading, isError } = useQuery({
  queryKey: ["adminGlobalListingsGrid"],
  queryFn: async () => {
    // CHANGE THIS: Use the admin-specific property API method
    const response = await api.get('/admin/properties'); 
    
    // Note: If using pagination, Laravel returns { data: [...], ... }
    // If not paginated, it returns [...] directly. Adjust based on your API response.
    const items = response.data.data || response.data || [];
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
    <div className="w-full font-sans text-[#141414] dark:text-gray-100 space-y-6">
      
      {/* ── HEADER TITLE AREA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Properties</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Welcome back, John</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#141414] dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-[#141414] px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Plus size={15} /> New Listing
        </button>
      </div>

      {/* ── SEARCH & SWITCH CONTROLS ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search listings by title, county or neighborhood..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-4 py-2.5 bg-white dark:bg-[#141414] border border-neutral-200/80 dark:border-gray-800 rounded-xl text-sm w-full focus:outline-none focus:border-[#141414] dark:focus:border-white focus:ring-1 focus:ring-[#141414] dark:focus:ring-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-[#141414] p-1 rounded-xl border border-neutral-200/40 dark:border-gray-800">
          <button 
            onClick={() => setViewMode("grid")}
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-white dark:bg-[#262626] text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400 hover:text-neutral-600")}
          >
            <Grid size={16} />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-white dark:bg-[#262626] text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400 hover:text-neutral-600")}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── LISTINGS CORE MATRIX RENDERER ── */}
      {isLoading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 bg-white dark:bg-[#141414] border border-neutral-200/60 dark:border-gray-800 rounded-[2rem]">
          <Loader2 size={26} className="animate-spin text-neutral-800 dark:text-white" />
          <p className="text-xs text-gray-400">Syncing platform listing shards...</p>
        </div>
      )}

      {isError && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white dark:bg-[#141414] rounded-[2rem] border border-neutral-200/60 dark:border-gray-800 p-6 text-center">
          <AlertTriangle size={32} className="text-red-500 mb-2" />
          <p className="text-xs font-semibold text-neutral-700 dark:text-gray-300">Database Stream Interrupted</p>
        </div>
      )}

      {!isLoading && !isError && filteredProperties.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white dark:bg-[#141414] border border-neutral-200/60 dark:border-gray-800 rounded-[2rem] p-8 text-center">
          <div className="w-12 h-12 bg-neutral-50 dark:bg-[#0A0A0A] rounded-full flex items-center justify-center border border-neutral-100 dark:border-gray-800 mb-4">
            <Search size={18} className="text-neutral-300 dark:text-gray-600" />
          </div>
          <h3 className="font-bold text-neutral-800 dark:text-white text-sm">No properties matched criteria</h3>
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
                "bg-white dark:bg-[#141414] border border-neutral-200/60 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] transition-all cursor-pointer group",
                viewMode === "list" && "flex items-center gap-6 p-4"
              )}
            >
              <div className={cn(
                "bg-neutral-100 dark:bg-[#0A0A0A] overflow-hidden relative shrink-0",
                viewMode === "grid" ? "aspect-[4/3] w-full" : "w-36 h-24 rounded-2xl"
              )}>
                <img src={item._signedImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider bg-white/90 dark:bg-[#141414]/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-neutral-800 dark:text-gray-200">
                  {item.status || "Active"}
                </span>
              </div>

              <div className={cn("p-6", viewMode === "list" && "p-0 flex-1")}>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white tracking-tight line-clamp-1">{item.title}</h3>
                <div className="flex items-center gap-1 text-xs text-neutral-400 dark:text-gray-500 mt-1 font-medium">
                  <MapPin size={12} />
                  <span>{item.location || "Nairobi, Kenya"}</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-neutral-100 dark:border-gray-800 mt-4 pt-3">
                  <span className="text-sm font-black text-neutral-900 dark:text-white tracking-tight">
                    {formatCurrency(item.price || 0)}
                  </span>
                  {item.agency && (
                    <span className="text-[10px] font-mono font-bold bg-neutral-50 dark:bg-[#0A0A0A] px-2.5 py-0.5 rounded border border-neutral-100 dark:border-gray-800 text-neutral-500 dark:text-gray-400">
                      {item.agency.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminNewListing 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};