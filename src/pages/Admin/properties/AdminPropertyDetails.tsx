// src/pages/Admin/properties/AdminPropertyDetails.tsx
import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, MapPin, Bed, Bath, Maximize2, Loader2, AlertTriangle, 
  CheckCircle, XCircle, Trash2, AlertCircle, User, X, Edit2, Save, 
  Plus, Upload, Trash2 as TrashIcon, RefreshCw, Check, Info
} from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties";
import { vaultApi } from "../../../api/vault";
import { api } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";

// Minimalist Toast Notification Component
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
  
  const icons = { 
    success: <Check className="w-4 h-4 text-[#141414]" />, 
    error: <AlertCircle className="w-4 h-4 text-neutral-500" />, 
    warning: <AlertTriangle className="w-4 h-4 text-neutral-500" />, 
    info: <Info className="w-4 h-4 text-neutral-500" /> 
  };
  
  return (
    <div className="fixed top-6 right-6 z-50 w-80 bg-[#141414] text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
      <div className="p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center">{icons[notification.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold tracking-wide uppercase">{notification.title}</p>
          <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{notification.message}</p>
        </div>
        <button title="Close" onClick={onClose} className="cursor-pointer flex-shrink-0 text-neutral-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Premium Confirmation Modal
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, isLoading = false }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/40 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 border border-neutral-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-[#141414] tracking-tight mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-[#141414] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#141414] hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold tracking-wide uppercase transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {isLoading ? "Processing..." : "Confirm Action"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminPropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{ index: number; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    location: "",
    address: "",
    bedrooms: "",
    baths: "",
    sqft: "",
    description: "",
    status: "",
    amenities: [] as string[]
  });
  const [newAmenity, setNewAmenity] = useState("");

  const addNotification = (type: ToastNotification['type'], title: string, message: string) => {
    const notifId = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id: notifId, type, title, message }]);
  };
  
  const removeNotification = (notifId: string) => setNotifications(prev => prev.filter(n => n.id !== notifId));

  // Query Asset Details
  const { data: detailData, isLoading, isError } = useQuery({
    queryKey: ["adminPropertyDetails", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await propertyApi.getById(id);
      const data = response.data || response;
      const propertyData = Array.isArray(data) ? data[0] : data;
      
      if (!propertyData) throw new Error("Property not found");
      
      // Safe array fallback
      const rawImages = Array.isArray(propertyData.images) ? propertyData.images : [];
      const imageUrls = rawImages.map((img: any) => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object') return img.url || img.s3_path || img;
        return null;
      }).filter(Boolean);
      
      const signedUrls = await Promise.all(
        imageUrls.map(async (url: string) => {
          try {
            if (url.startsWith('http://') || url.startsWith('https://')) return url;
            return await vaultApi.getSignedUrl(url);
          } catch (error) {
            console.error("Signed URL acquisition error:", error);
            return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200";
          }
        })
      );
      
      let agentInfo = null;
      if (propertyData.agent_id) {
        try {
          const agentResponse = await api.get(`/users/${propertyData.agent_id}`);
          agentInfo = agentResponse.data;
        } catch (err) {
          console.warn("Pipeline assignment info offline:", err);
        }
      }
      
      return { 
        property: propertyData, 
        images: signedUrls || [],
        imageUrls: imageUrls || [],
        agentInfo
      };
    },
    enabled: !!id
  });

  const property = detailData?.property;

  const { data: agentsData } = useQuery({
    queryKey: ["adminAgentsList"],
    queryFn: async () => {
      const response = await api.get('/users/agents');
      // Ensure we always return an array even if the endpoint fails quietly
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!detailData?.property
  });
  
  const updatePropertyMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!id) return;
      return propertyApi.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPropertyDetails", id] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"] });
      addNotification('success', 'Asset Saved', 'Changes successfully written to ledger.');
      setIsEditing(false);
    },
    onError: (error: any) => {
      addNotification('error', 'Sync Failure', error?.message || 'Could not commit properties changes.');
    }
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async (status: "Active" | "Suspended") => {
      if (!id) return;
      return propertyApi.update(id, { status: status.toLowerCase() as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPropertyDetails", id] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"] });
      addNotification('success', 'Status Changed', 'Market visibility setting updated.');
    },
    onError: (error: any) => {
      addNotification('error', 'Status Failure', error?.message || 'Listing state transition halted.');
    }
  });
  
  const uploadImagesMutation = useMutation({
    mutationFn: async (files: FileList) => {
      if (!property) throw new Error("Property context isolated");
      const uploadedPaths = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `property-images/${property.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        uploadedPaths.push(filePath);
      }

      // Safe fallback if images is null
      const existingImages = Array.isArray(property.images) ? property.images : [];
      const existingPaths = existingImages.map((img: any) => 
          typeof img === 'string' ? img : (img.url || img.s3_path)
      ).filter(Boolean);
      
      return propertyApi.update(property.id, { 
        images: [...existingPaths, ...uploadedPaths] 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPropertyDetails", id] });
      addNotification('success', 'Media Appended', 'New photography added to gallery grid.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error: any) => {
      addNotification('error', 'Storage Failure', error?.message || 'Bucket writing failed.');
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      if (!property) throw new Error("Property context isolated");
      
      const existingImages = Array.isArray(property.images) ? property.images : [];
      const existingUrls = existingImages.map((img: any) => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object') return img.url || img.s3_path;
        return null;
      }).filter(Boolean);
      
      const filteredUrls = existingUrls.filter((url: string) => url !== imageUrl);
      return propertyApi.update(property.id, { images: filteredUrls });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPropertyDetails", id] });
      addNotification('success', 'Media Erased', 'Media reference removed.');
      setImageToDelete(null);
    },
    onError: (error: any) => {
      addNotification('error', 'Removal Halted', error?.message || 'Failed to clean asset mirror.');
    }
  });
  
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const { data } = await api.delete(`/admin/properties/${propertyId}`);
      return data;
    },
    onSuccess: () => {
      addNotification('success', 'Archived', 'Listing shifted to administrative trash views.');
      queryClient.invalidateQueries({ queryKey: ["adminProperties"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"], exact: false });
      navigate("/admin/properties");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'De-indexing failed.';
      addNotification('error', 'Action Aborted', message);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  });

  const forceDeleteMutation = useMutation({
    mutationFn: async (targetId: string) => {
      return api.delete(`/admin/properties/${targetId}/permanent`);
    },
    onSuccess: () => {
      addNotification('success', 'Purged Clean', 'Record scrubbed from persistent tables.');
      queryClient.invalidateQueries({ queryKey: ["adminProperties"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"], exact: false });
      navigate("/admin/properties");
    },
    onError: () => {
      addNotification('error', 'Purge Refused', 'Hard delete cycle rejected by remote controller.');
    }
  });

  const reassignPropertyMutation = useMutation({
    mutationFn: async ({ propertyId, agentId }: { propertyId: string; agentId: string }) => {
      return api.put(`/admin/properties/${propertyId}/reassign`, { agent_id: agentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPropertyDetails", id] });
      addNotification('success', 'Account Shifted', 'Portfolio allocation pipeline rewritten.');
    },
    onError: (error: any) => {
      addNotification('error', 'Assignment Failed', error?.message || 'Pipeline re-routing failed.');
    }
  });
  
  const handleEditToggle = () => {
    if (!isEditing && property) {
      setEditForm({
        title: property.title || "",
        price: property.price ? String(property.price) : "",
        location: property.location || "",
        address: property.address || "",
        bedrooms: property.bedrooms ? String(property.bedrooms) : "",
        baths: property.baths ? String(property.baths) : "",
        sqft: property.sqft ? String(property.sqft) : "",
        description: property.description || "",
        status: property.status || "Active",
        amenities: Array.isArray(property.amenities) ? property.amenities : []
      });
    }
    setIsEditing(!isEditing);
  };
  
  const handleCancelEdit = () => setIsEditing(false);

  const handleSaveChanges = () => {
    updatePropertyMutation.mutate({
      title: editForm.title,
      price: Number(editForm.price) || 0,
      location: editForm.location,
      address: editForm.address,
      bedrooms: Number(editForm.bedrooms) || 0,
      baths: Number(editForm.baths) || 0,
      sqft: Number(editForm.sqft) || 0,
      description: editForm.description,
      amenities: editForm.amenities
    });
  };
  
  const handleAddAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmenity.trim() && !editForm.amenities.includes(newAmenity.trim())) {
      setEditForm({
        ...editForm,
        amenities: [...editForm.amenities, newAmenity.trim()]
      });
      setNewAmenity("");
    }
  };
  
  const handleRemoveAmenity = (amenity: string) => {
    setEditForm({
      ...editForm,
      amenities: editForm.amenities.filter(a => a !== amenity)
    });
  };
  
  const handleDeleteClick = () => {
    if (!property) return;
    setDeleteTarget({ id: property.id, title: property.title || 'Unknown Property' });
    setShowDeleteConfirm(true);
  };
  const handleImageDelete = (imageUrl: string, index: number) => {
    setImageToDelete({ index, url: imageUrl });
  };
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024;
      if (!isValidType) addNotification('warning', 'Type Disallowed', `${file.name} is skipped.`);
      if (!isValidSize) addNotification('warning', 'Payload Limit', `${file.name} clears 10MB limit.`);
      return isValidType && isValidSize;
    });
    
    if (validFiles.length === 0) return;
    
    const dataTransfer = new DataTransfer();
    validFiles.forEach(file => dataTransfer.items.add(file));
    uploadImagesMutation.mutate(dataTransfer.files);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 font-sans">
        <Loader2 size={24} className="animate-spin text-[#141414]" />
        <p className="text-xs tracking-widest uppercase text-neutral-400 font-medium">Loading Portfolio Grid...</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-12 text-center space-y-6 font-sans">
        <p className="text-xs font-bold tracking-widest uppercase text-neutral-400">Error 404 // File Missing</p>
        <h2 className="text-2xl font-black text-[#141414] tracking-tight">Asset Records Isolated</h2>
        <button onClick={() => navigate("/admin/properties")} className="cursor-pointer px-6 py-3 bg-[#141414] text-white rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-colors">
          Return to Registry
        </button>
      </div>
    );
  }

  // Safe destructuring with fallback values to prevent UI render crashes
  const images = Array.isArray(detailData?.images) ? detailData.images : [];
  const agentInfo = detailData?.agentInfo || null;
  const status = String(property.status || "").toLowerCase();
  const isLive = status === "active" || status === "active_listing";
  const agentName = property.agent?.name || agentInfo?.name || "Unassigned Account";
  
  // Convert ID to string before manipulating to prevent crash on numeric IDs
  const displayId = String(property.id || "").substring(0, 8);

  return (
    <div className="space-y-8 pb-16 font-sans text-[#141414] max-w-[1400px] mx-auto px-4">
      
      {/* Absolute Dynamic Notification Portal */}
      <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto">
            <Toast notification={n} onClose={() => removeNotification(n.id)} />
          </div>
        ))}
      </div>

      <ConfirmationModal 
        isOpen={showDeleteConfirm} 
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} 
        onConfirm={() => { if (deleteTarget) deletePropertyMutation.mutate(deleteTarget.id); }} 
        title="Delete Property" 
        message={`Are you absolutely sure you want to move "${deleteTarget?.title}" to trash?`} 
        isLoading={deletePropertyMutation.isPending} 
      />

      <ConfirmationModal 
        isOpen={!!imageToDelete} 
        onClose={() => setImageToDelete(null)} 
        onConfirm={() => {
          if (imageToDelete && detailData?.imageUrls) {
            deleteImageMutation.mutate(detailData.imageUrls[imageToDelete.index]);
          }
        }} 
        title="Delete Image" 
        message="Are you sure you want to remove this image from the gallery?" 
        isLoading={deleteImageMutation.isPending} 
      />

      {/* Navigation Line + Administrative Action Switchboards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <button onClick={() => navigate("/admin/properties")} className="cursor-pointer flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-neutral-400 hover:text-[#141414] transition-colors">
          <ArrowLeft size={14} /> Back to Registry
        </button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancelEdit} 
                className="cursor-pointer px-4 py-2 bg-white text-neutral-400 text-xs font-bold tracking-wider uppercase hover:text-[#141414] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges} 
                disabled={updatePropertyMutation.isPending} 
                className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-[#141414] text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {updatePropertyMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} 
                Commit Changes
              </button>
            </>
          ) : (
            <>
              <button onClick={handleEditToggle} className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-[#141414] rounded-xl text-xs font-bold tracking-wider uppercase transition-all">
                <Edit2 size={12} /> Modify Index
              </button>
              {isLive ? (
                <button onClick={() => updateStatusMutation.mutate("Suspended")} disabled={updateStatusMutation.isPending} className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-neutral-100 text-neutral-600 rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-neutral-200 transition-all disabled:opacity-50">
                  {updateStatusMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Delist
                </button>
              ) : (
                <button onClick={() => updateStatusMutation.mutate("Active")} disabled={updateStatusMutation.isPending} className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-[#141414] text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-neutral-800 transition-all disabled:opacity-50">
                  {updateStatusMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Deploy Live
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modern High-End Hero Display */}
      <div className="aspect-[21/9] bg-neutral-50 rounded-[2rem] overflow-hidden relative border border-neutral-100">
        <img 
          src={images[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200"} 
          className="w-full h-full object-cover" 
          alt={property.title || "Cover Frame"} 
        />
        <div className="absolute top-6 left-6 bg-[#141414]/80 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-mono tracking-wider uppercase">
          INDEX ID: {displayId}...
        </div>
      </div>

      {/* Main Agent Column Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Primary Structural Metadata Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Descriptive Info Block */}
          <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm space-y-6">
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Asset Heading Name</label>
                  <input id="title" type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full text-xl font-bold border-b border-neutral-200 focus:border-[#141414] focus:outline-none pb-2 text-[#141414]" placeholder="E.g. Modern Minimalist Penthouse" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Region Territory</label>
                    <input id="location" type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full text-sm border-b border-neutral-200 focus:border-[#141414] focus:outline-none pb-2" placeholder="E.g. Westlands, Nairobi" />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Physical Location Address</label>
                    <input id="address" type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full text-sm border-b border-neutral-200 focus:border-[#141414] focus:outline-none pb-2" placeholder="E.g. 12 Ring Road Avenue" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div>
                    <label htmlFor="bedrooms" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Beds</label>
                    <input id="bedrooms" type="number" value={editForm.bedrooms} onChange={e => setEditForm({...editForm, bedrooms: e.target.value})} className="w-full border border-neutral-200 text-sm text-[#141414] rounded-xl p-2.5 focus:border-[#141414] focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="baths" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Baths</label>
                    <input id="baths" type="number" value={editForm.baths} onChange={e => setEditForm({...editForm, baths: e.target.value})} className="w-full border border-neutral-200 text-sm text-[#141414] rounded-xl p-2.5 focus:border-[#141414] focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="sqft" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Footage (Sqft)</label>
                    <input id="sqft" type="number" value={editForm.sqft} onChange={e => setEditForm({...editForm, sqft: e.target.value})} className="w-full border border-neutral-200 text-sm text-[#141414] rounded-xl p-2.5 focus:border-[#141414] focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Detailed Presentation Narrative</label>
                  <textarea id="description" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={5} className="w-full border border-neutral-200 text-sm text-[#141414] rounded-xl p-4 focus:border-[#141414] focus:outline-none placeholder-neutral-300 leading-relaxed" placeholder="Structure narrative copy for potential investors..."></textarea>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">Architectural Narrative</span>
                  <h1 className="text-2xl font-black text-[#141414] tracking-tight">{property.title || "Uncaptioned Asset Registry"}</h1>
                  <p className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium pt-1"><MapPin size={14} className="text-neutral-400" /> {property.location || "Location not catalogued"}</p>
                  {property.address && <p className="text-[11px] text-neutral-400 ml-5">{property.address}</p>}
                </div>
                
                <div className="grid grid-cols-3 gap-4 py-5 border-y border-neutral-100 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-2"><Bed size={16} className="text-neutral-400" /> <span className="text-xs font-bold text-[#141414]">{property.bedrooms || 0} Bedrooms</span></div>
                  <div className="flex flex-col sm:flex-row items-center gap-2"><Bath size={16} className="text-neutral-400" /> <span className="text-xs font-bold text-[#141414]">{property.baths || 0} Bathrooms</span></div>
                  <div className="flex flex-col sm:flex-row items-center gap-2"><Maximize2 size={16} className="text-neutral-400" /> <span className="text-xs font-bold text-[#141414]">{property.sqft ? Number(property.sqft).toLocaleString() : 0} Sqft</span></div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">{property.description || "No narrative details associated with this registry item."}</p>
                </div>
              </>
            )}
          </div>

          {/* Secure Premium Storage Vault Grid */}
          <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Asset Photography</h3>
                <p className="text-xs text-neutral-400 mt-0.5">High-definition media records</p>
              </div>
              <div>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploadImagesMutation.isPending}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {uploadImagesMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  Upload Media
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((imgUrl: string, idx: number) => (
                <div key={idx} className="aspect-[4/3] bg-neutral-50 rounded-2xl overflow-hidden relative group border border-neutral-100 shadow-inner">
                  <img src={imgUrl} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-300" alt="Vault asset" />
                  <button 
                    onClick={() => handleImageDelete(imgUrl, idx)}
                    className="absolute top-3 right-3 p-2 bg-white hover:bg-[#141414] rounded-xl text-neutral-600 hover:text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Remove Photo"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              ))}
              {images.length === 0 && (
                <div className="col-span-full py-12 text-center text-xs tracking-wide text-neutral-400 border border-dashed border-neutral-200 rounded-2xl">
                  No images uploaded for this catalog entry.
                </div>
              )}
            </div>
          </div>

          {/* Premium Architectural Amenities Index */}
          <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Asset Parameters & Features</h3>
            
            {isEditing ? (
              <div className="space-y-4">
                <form onSubmit={handleAddAmenity} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newAmenity} 
                    onChange={e => setNewAmenity(e.target.value)}
                    placeholder="Add specification attribute..." 
                    className="flex-1 border border-neutral-200 text-xs rounded-xl p-3 focus:border-[#141414] focus:outline-none"
                  />
                  <button type="submit" className="px-4 bg-[#141414] text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors">
                    <Plus size={14} />
                  </button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(editForm.amenities) && editForm.amenities.map((amenity, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 text-xs bg-neutral-50 font-bold tracking-wide border border-neutral-100 px-3 py-1.5 rounded-lg text-[#141414]">
                      {amenity}
                      <button type="button" onClick={() => handleRemoveAmenity(amenity)} className="text-neutral-400 hover:text-black">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.isArray(property.amenities) && property.amenities.map((amenity: string, idx: number) => (
                  <span key={idx} className="text-xs bg-neutral-50 border border-neutral-100 font-medium px-3.5 py-2 rounded-xl text-neutral-700 tracking-wide">
                    {amenity}
                  </span>
                ))}
                {(!Array.isArray(property.amenities) || property.amenities.length === 0) && (
                  <p className="text-xs text-neutral-400 italic">No design specifications labeled.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Workspace Context Metrics Sidebar */}
        <div className="space-y-6">
          
          {/* Market Capital Appraisals Card */}
          <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm space-y-4">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Financial Valuation</p>
              {isEditing ? (
                <input 
                  type="number" 
                  value={editForm.price} 
                  onChange={e => setEditForm({...editForm, price: e.target.value})} 
                  className="w-full text-2xl font-black border-b border-neutral-200 focus:outline-none pb-2 text-[#141414]" 
                  placeholder="Asset valuation sum" 
                />
              ) : (
                <h2 className="text-3xl font-black text-[#141414] tracking-tight">{formatCurrency(Number(property.price) || 0)}</h2>
              )}
            </div>
            
            <div className="pt-4 border-t border-neutral-50 flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-semibold tracking-wide uppercase text-[9px]">Market Status</span>
              <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[9px] ${
                status === "active" || status === "active_listing" 
                  ? "bg-neutral-900 text-white" 
                  : "bg-neutral-100 text-neutral-500"
              }`}>
                {property.status || "Unindexed"}
              </span>
            </div>
          </div>

          {/* Secure Allocation Assignment Pipe */}
          <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm space-y-4">
            <div>
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Primary Account Officer</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Assigned pipeline manager</p>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600">
                <User size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-800 truncate">{agentName}</p>
                <p className="text-[10px] text-neutral-400 truncate font-mono">{property.agent?.email || "No direct link channel"}</p>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Reallocate Agent Vault</label>
              <div className="relative">
                <select 
                  value={property.agent_id || ""} 
                  onChange={(e) => reassignPropertyMutation.mutate({ propertyId: property.id, agentId: e.target.value })}
                  disabled={reassignPropertyMutation.isPending}
                  className="w-full text-xs border border-neutral-200 rounded-xl p-3 bg-white focus:border-[#141414] focus:outline-none appearance-none tracking-wide text-neutral-600 font-medium"
                >
                  <option value="">Select Portfolio Holder...</option>
                  {agentsData?.map((agent: any) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} — ({agent.email})
                    </option>
                  ))}
                </select>
                {reassignPropertyMutation.isPending && (
                  <div className="absolute right-3 top-3">
                    <RefreshCw size={12} className="animate-spin text-neutral-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Minimalist Premium Deletion Drawer (Agent Workspace Style) */}
          <div className="bg-white rounded-[2rem] p-6 border border-neutral-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">Registry Life-Cycle</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Catalog database routing protocols</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleDeleteClick}
                disabled={deletePropertyMutation.isPending}
                className="w-full py-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deletePropertyMutation.isPending ? "Archiving Record..." : "Move to Trash Archives"}
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm("CRITICAL: Permanent wipe deletes this record forever and clears linked bucket structures. Commit permanent erasure?")) {
                    forceDeleteMutation.mutate(property.id);
                  }
                }}
                disabled={forceDeleteMutation.isPending}
                className="w-full py-3 bg-white hover:bg-red-50 text-neutral-400 hover:text-red-600 border border-neutral-100 hover:border-red-200 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {forceDeleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Wipe Ledger Permanently
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};