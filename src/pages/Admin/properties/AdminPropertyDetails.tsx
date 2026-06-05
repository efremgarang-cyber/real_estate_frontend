// src/pages/Admin/properties/AdminPropertyDetails.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Bed, Bath, Maximize2, ShieldCheck, ShieldAlert, Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties";
import { vaultApi } from "../../../api/vault";

export const AdminPropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: detailData, isLoading, isError } = useQuery({
    queryKey: ["adminListingInspectionNode", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await propertyApi.getById(id);
      const data = response.data;

      const rawImages = data?.images || [];
      const signedUrls = await Promise.all(
        rawImages.map(async (img: any) => {
          const path = typeof img === "object" ? img.s3_path || img.url : img;
          try {
            return await vaultApi.getSignedUrl(path);
          } catch {
            return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200";
          }
        })
      );

      return { property: data, images: signedUrls.length > 0 ? signedUrls : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200"] };
    },
    enabled: !!id
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: "Active" | "Suspended") => {
      if (!id) return;
      return propertyApi.update(id, { status: status.toLowerCase() as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminListingInspectionNode", id] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"] });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={24} className="animate-spin text-neutral-900 dark:text-white" />
        <p className="text-xs text-neutral-400">Loading asset specification files...</p>
      </div>
    );
  }

  if (isError || !detailData) {
    return (
      <div className="min-h-[45vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={32} className="text-red-500 mb-2" />
        <p className="text-sm font-semibold text-neutral-800 dark:text-gray-100">Failed to resolve asset parameter node.</p>
      </div>
    );
  }

  const { property, images } = detailData;
  const status = String(property.status);
  const isLive = status === "active" || status === "active_listing";
  const agencyName = (property as { agency?: { name?: string } }).agency?.name || "Global Root Admin";

  return (
    <div className="space-y-6 font-sans text-[#141414] dark:text-gray-100 pb-12">
      
      {/* ── DETAILED CONTROL BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-gray-800 pb-4">
        <div>
          <button onClick={() => navigate("/admin/properties")} className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors uppercase tracking-wider mb-1">
            <ArrowLeft size={13} /> Back to Directory
          </button>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{property.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {isLive ? (
            <button 
              onClick={() => updateStatusMutation.mutate("Suspended")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100/70 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all"
            >
              <XCircle size={14} /> Suspend Listing
            </button>
          ) : (
            <button 
              onClick={() => updateStatusMutation.mutate("Active")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <CheckCircle size={14} /> Approve & Publish
            </button>
          )}
        </div>
      </div>

      {/* ── MEDIA INSPECTION VAULT ── */}
      <div className="grid grid-cols-1 gap-4">
        <div className="aspect-[21/9] rounded-[2rem] overflow-hidden border border-neutral-200/50 dark:border-gray-800">
          <img src={images[0]} alt="Primary Content Storage Stream" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* ── SUMMARY SPECS DECK ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white dark:bg-[#141414] p-6 rounded-[2rem] border border-neutral-200/60 dark:border-gray-800 space-y-4">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Asset Metrics</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-neutral-50 dark:bg-[#0A0A0A] p-4 rounded-xl border border-neutral-100 dark:border-gray-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400">Baseline Price</span>
              <p className="text-sm font-black text-neutral-800 dark:text-white mt-0.5">{formatCurrency(Number(property.price || 0))}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400">Bedrooms</span>
              <p className="text-sm font-bold text-neutral-800 dark:text-white mt-0.5 flex items-center gap-1"><Bed size={13} /> {property.bedrooms || "-"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400">Bathrooms</span>
              <p className="text-sm font-bold text-neutral-800 dark:text-white mt-0.5 flex items-center gap-1"><Bath size={13} /> {property.baths || "-"}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400">Total Area</span>
              <p className="text-sm font-bold text-neutral-800 dark:text-white mt-0.5 flex items-center gap-1"><Maximize2 size={13} /> {property.sqft || "-"} SQFT</p>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Geographic Node</span>
            <p className="text-sm font-medium flex items-center gap-1.5 text-neutral-700 dark:text-gray-300"><MapPin size={14} className="text-neutral-400" /> {property.location}</p>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-gray-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400">System Narrative Description</span>
            <p className="text-xs text-neutral-600 dark:text-gray-400 leading-relaxed font-normal">{property.description || "No description payload uploaded."}</p>
          </div>
        </div>

        {/* RIGHTS AND MODERATION SUMMARY METRICS */}
        <div className="bg-white dark:bg-[#141414] p-6 rounded-[2rem] border border-neutral-200/60 dark:border-gray-800 space-y-4">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Compliance Registry</h3>
          <div className="flex items-center gap-2 text-xs font-bold">
            {isLive ? (
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full flex items-center gap-1"><ShieldCheck size={13} /> Active & Verified</span>
            ) : (
              <span className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full flex items-center gap-1"><ShieldAlert size={13} /> Halted / Suspended</span>
            )}
          </div>
          <div className="text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-100 dark:border-gray-800 space-y-1.5">
            <p>Asset ID: <span className="text-neutral-700 dark:text-gray-300 font-bold uppercase">{property.id}</span></p>
            <p>Tenant Owner: <span className="text-neutral-700 dark:text-gray-300 font-bold">{agencyName}</span></p>
          </div>
        </div>
      </div>

    </div>
  );
};