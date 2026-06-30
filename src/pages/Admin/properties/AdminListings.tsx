// src/pages/Admin/properties/AdminListings.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Grid, List, Plus, MapPin, Loader2, AlertTriangle, Trash2, X, CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency, cn } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties";
import { vaultApi } from "../../../api/vault";
import { AdminNewListing } from "./AdminNewListing";
import {api} from "../../../lib/api";

// ── Toast Notification Component ──
interface ToastNotification { 
  id: string; 
  type: 'success' | 'error' | 'info' | 'warning'; 
  title: string; 
  message: string; 
}

const Toast: React.FC<{ notification: ToastNotification; onClose: () => void }> = ({ notification, onClose }) => {
  React.useEffect(() => { 
    const timer = setTimeout(() => onClose(), 5000); 
    return () => clearTimeout(timer); 
  }, [onClose]);
  
  const icons: Record<string, React.ReactNode> = { 
    success: <CheckCircle className="w-5 h-5 text-green-600" />, 
    error: <AlertCircle className="w-5 h-5 text-red-600" />, 
    warning: <AlertTriangle className="w-5 h-5 text-orange-600" />, 
    info: <AlertCircle className="w-5 h-5 text-blue-600" /> 
  };
  
  const colors: Record<string, string> = { 
    success: "bg-green-50 border-green-200", 
    error: "bg-red-50 border-red-200", 
    warning: "bg-orange-50 border-orange-200", 
    info: "bg-blue-50 border-blue-200" 
  };
  
  return (
    <div className={`fixed top-4 right-4 z-50 w-96 rounded-xl border shadow-lg ${colors[notification.type]} animate-in slide-in-from-top-2 duration-300`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{icons[notification.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
            <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
          </div>
          <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Inline Delete Confirmation Modal ──
const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  propertyTitle: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}> = ({ isOpen, propertyTitle, onClose, onConfirm, isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Delete Property</h3>
        </div>
        <p className="text-gray-600 mb-2">
          Are you sure you want to delete this property?
        </p>
        <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-2 rounded-lg mb-6 truncate">
          "{propertyTitle}"
        </p>
        <p className="text-xs text-red-500 mb-4">
          This property is expired/sold. Deleting will move it to trash.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminListings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Toast & Delete state
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const addNotification = (type: ToastNotification['type'], title: string, message: string) => {
    const notifId = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id: notifId, type, title, message }]);
  };

  const removeNotification = (notifId: string) => setNotifications(prev => prev.filter(n => n.id !== notifId));

  const { data: properties = [], isLoading, isError } = useQuery({
    queryKey: ["adminGlobalListingsGrid"],
    queryFn: async () => {
      const response = await api.get('/admin/properties'); 
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

  // ── Delete Property Mutation ──
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const { data } = await api.delete(`/admin/properties/${propertyId}`);
      return data;
    },
    onSuccess: () => {
      addNotification('success', 'Property Deleted', 'The property has been moved to the trash.');
      queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["adminProperties"], exact: false });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete property.';
      addNotification('error', 'Deletion Failed', message);
      setDeleteTarget(null);
    }
  });

  const handleDeleteClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setDeleteTarget({ id: item.id, title: item.title });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deletePropertyMutation.mutate(deleteTarget.id);
    }
  };

  // Determine if property is expired or sold
  const isExpiredOrSold = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'expired' || s === 'under_contract' || s === 'closed' || s === 'sold';
  };

  const filteredProperties = properties.filter((p: any) =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full font-sans text-[#141414] dark:text-gray-100 space-y-6">
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(n => <Toast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />)}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        propertyTitle={deleteTarget?.title || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={deletePropertyMutation.isPending}
      />

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
                {/* Expired/Sold indicator */}
                {isExpiredOrSold(item.status) && (
                  <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider bg-red-500/90 text-white px-2.5 py-0.5 rounded-full">
                    {item.status === 'expired' ? 'EXPIRED' : 'SOLD'}
                  </span>
                )}
              </div>

              <div className={cn("p-6", viewMode === "list" && "p-0 flex-1")}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-white tracking-tight line-clamp-1">{item.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-neutral-400 dark:text-gray-500 mt-1 font-medium">
                      <MapPin size={12} />
                      <span>{item.location || "Nairobi, Kenya"}</span>
                    </div>
                  </div>
                  {/* Delete button for expired/sold properties */}
                  {isExpiredOrSold(item.status) && (
                    <button
                      onClick={(e) => handleDeleteClick(e, item)}
                      className="flex-shrink-0 ml-2 p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 hover:text-red-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete expired/sold property"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
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