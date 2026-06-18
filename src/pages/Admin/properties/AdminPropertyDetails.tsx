// src/pages/Admin/properties/AdminPropertyDetails.tsx
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, MapPin, Bed, Bath, Maximize2, ShieldCheck, ShieldAlert, 
  Loader2, AlertTriangle, CheckCircle, XCircle, Trash2, AlertCircle,
  Calendar, Home, Building, User, Mail, Phone, FileText, X, Edit2, 
  Save, Image as ImageIcon, Plus, Upload, Camera, Trash2 as TrashIcon,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties";
import { vaultApi } from "../../../api/vault";
import { api } from "../../../lib/api";
import { supabase } from "../../../lib/supabase";

// Toast Notification Component
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
    success: <CheckCircle className="w-5 h-5 text-green-600" />, 
    error: <AlertCircle className="w-5 h-5 text-red-600" />, 
    warning: <AlertTriangle className="w-5 h-5 text-orange-600" />, 
    info: <AlertCircle className="w-5 h-5 text-blue-600" /> 
  };
  
  const colors = { 
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

// Confirmation Modal Component
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
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
            {isLoading ? "Processing..." : "Confirm"}
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit form state
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

  // Fetch property details
  const { data: detailData, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminPropertyDetails", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await propertyApi.getById(id);
      const data = response.data || response;

      
      const propertyData = Array.isArray(data) ? data[0] : data;
      
      if (!propertyData) throw new Error("Property not found");
      
      // Handle images - extract URLs correctly
      const rawImages = propertyData.images || [];
      
      // Convert image objects to URLs if needed
      const imageUrls = rawImages.map((img: any) => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object') return img.url || img.s3_path || img;
        return null;
      }).filter(Boolean);
      
      // Get signed URLs for display
      const signedUrls = await Promise.all(
        imageUrls.map(async (url: string) => {
          try {
            // If it's already a full URL, return it
            if (url.startsWith('http://') || url.startsWith('https://')) {
              return url;
            }
            // Otherwise get signed URL from vault
            return await vaultApi.getSignedUrl(url);
          } catch (error) {
            console.error("Failed to get signed URL for:", url, error);
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
          console.warn("Could not fetch agent info:", err);
        }
      }
      
      return { 
        property: propertyData, 
        images: signedUrls,
        imageUrls: imageUrls, // Store the original URLs for updating
        agentInfo
      };
    },
    enabled: !!id
   
  });
  const property = detailData?.property;
  
  // Fetch all agents
  const { data: agentsData } = useQuery({
    queryKey: ["adminAgentsList"],
    queryFn: async () => {
      const response = await api.get('/users/agents');
      return response.data;
    },
    enabled: !!detailData?.property
  });
  
  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!id) return;
      return propertyApi.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPropertyDetails", id] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"] });
      addNotification('success', 'Property Updated', 'Property details saved successfully.');
      setIsEditing(false);
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      addNotification('error', 'Update Failed', error?.message || 'Could not save changes.');
    }
  });
  
  // Update property status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: "Active" | "Suspended") => {
      if (!id) return;
      return propertyApi.update(id, { status: status.toLowerCase() as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPropertyDetails", id] });
      queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"] });
      addNotification('success', 'Status Updated', 'Property status changed successfully.');
    },
    onError: (error: any) => {
      addNotification('error', 'Update Failed', error?.message || 'Could not update property status.');
    }
  });
  
  // Upload images mutation
 const uploadImagesMutation = useMutation({
  mutationFn: async (files: FileList) => {
    if (!property) throw new Error("Property context is missing");
    const uploadedPaths = [];

    // 1. Direct Upload to Supabase (Bypassing your Laravel API)
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

    // 2. ONLY NOW update the database via Laravel with the file paths
    const existingPaths = property.images?.map((img: any) => 
        typeof img === 'string' ? img : (img.url || img.s3_path)
    ).filter(Boolean) || [];
    
    return propertyApi.update(property.id, { 
      images: [...existingPaths, ...uploadedPaths] 
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["adminPropertyDetails", id] });
    addNotification('success', 'Images Uploaded', 'Image(s) added successfully.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  },
  onError: (error: any) => {
    console.error("DEBUG SUPABASE ERROR:", error);
    addNotification('error', 'Upload Failed', error?.message || 'Check bucket name.');
  }
});
  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      if (!property) throw new Error("Property context is missing");
      
      // Get existing image URLs
      const existingUrls = property.images?.map((img: any) => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object') return img.url || img.s3_path;
        return null;
      }).filter(Boolean) || [];
      
      // Filter out the image to delete
      const filteredUrls = existingUrls.filter((url: string) => url !== imageUrl);
      
      // Update property with filtered images
      return propertyApi.update(property.id, { images: filteredUrls });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPropertyDetails", id] });
      addNotification('success', 'Image Deleted', 'Image removed successfully.');
      setImageToDelete(null);
    },
    onError: (error: any) => {
      console.error("Delete image error:", error);
      addNotification('error', 'Deletion Failed', error?.response?.data?.message || error?.message || 'Could not delete image.');
    }
  });
  
  // Delete property mutation
const deletePropertyMutation = useMutation({
  mutationFn: async (propertyId: string) => {
    const { data } = await api.delete(`/admin/properties/${propertyId}`);
    return data;
  },
  onSuccess: () => {
    addNotification('success', 'Property Deleted', 'The property has been moved to the trash.');

    // IMPORTANT: Clear the cache for the entire list
    // 'exact: false' ensures all sub-pages of your paginated list are cleared
    queryClient.invalidateQueries({ queryKey: ["adminProperties"], exact: false });
    queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"], exact: false });

    // Navigate immediately so the component re-mounts and fetches fresh data
    navigate("/admin/properties");
  },
  onError: (error: any) => {
    console.error("Deletion failed:", error);
    const message = error?.response?.data?.message || error?.message || 'Failed to delete property.';
    addNotification('error', 'Deletion Failed', message);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  }
});
  const forceDeleteMutation = useMutation({
  mutationFn: async (id: string) => {
    return api.delete(`/admin/properties/${id}/permanent`);
  },
  onSuccess: () => {
    addNotification('success', 'Deleted', 'Property permanently removed.');
    
    // 1. Invalidate both keys to be safe
    queryClient.invalidateQueries({ queryKey: ["adminProperties"], exact: false });
    queryClient.invalidateQueries({ queryKey: ["adminGlobalListingsGrid"], exact: false });
    
    // 2. Navigate immediately
    navigate("/admin/properties");
  },
  onError: (error: any) => {
    addNotification('error', 'Delete Failed', 'Could not permanently remove property.');
  }
});
  // Reassign property mutation
  const reassignPropertyMutation = useMutation({
    mutationFn: async ({ propertyId, agentId }: { propertyId: string; agentId: string }) => {
      return api.put(`/admin/properties/${propertyId}/reassign`, { agent_id: agentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPropertyDetails", id] });
      addNotification('success', 'Property Reassigned', 'The property has been reassigned.');
    },
    onError: (error: any) => {
      addNotification('error', 'Reassignment Failed', error?.message || 'Could not reassign property.');
    }
  });
  
  const handleEditToggle = () => {
    if (!isEditing && property) {
      setEditForm({
        title: property.title || "",
        price: property.price?.toString() || "",
        location: property.location || "",
        address: property.address || "",
        bedrooms: property.bedrooms?.toString() || "",
        baths: property.baths?.toString() || "",
        sqft: property.sqft?.toString() || "",
        description: property.description || "",
        status: property.status || "Active",
        amenities: property.amenities || []
      });
    }
    setIsEditing(!isEditing);
  };
  
  const handleSaveChanges = () => {
    updatePropertyMutation.mutate({
      title: editForm.title,
      price: Number(editForm.price),
      location: editForm.location,
      address: editForm.address,
      bedrooms: Number(editForm.bedrooms),
      baths: Number(editForm.baths),
      sqft: Number(editForm.sqft),
      description: editForm.description,
      amenities: editForm.amenities
    });
  };
  
  const handleAddAmenity = () => {
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
    setDeleteTarget({ id: property.id, title: property.title });
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    if (deleteTarget) {
      deletePropertyMutation.mutate(deleteTarget.id);
    }
  };
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Validate files
    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isValidType) addNotification('warning', 'Invalid File', `${file.name} is not an image.`);
      if (!isValidSize) addNotification('warning', 'File Too Large', `${file.name} exceeds 10MB.`);
      return isValidType && isValidSize;
    });
    
    if (validFiles.length === 0) return;
    
    // Create a new FileList-like object
    const dataTransfer = new DataTransfer();
    validFiles.forEach(file => dataTransfer.items.add(file));
    
    uploadImagesMutation.mutate(dataTransfer.files);
  };
  
  const handleImageDelete = (imageUrl: string, index: number) => {
    setImageToDelete({ index, url: imageUrl });
  };
  
  const confirmImageDelete = () => {
    if (imageToDelete) {
      deleteImageMutation.mutate(imageToDelete.url);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-neutral-900" />
        <p className="text-sm font-medium text-gray-500">Loading property data...</p>
      </div>
    );
  }
  
  if (isError || !detailData?.property) {
    return (
      <div className="min-h-[45vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Property Not Found</h2>
        <p className="text-gray-500 mb-6">The requested property could not be located.</p>
        <button 
          onClick={() => navigate("/admin/properties")}
          className="px-6 py-3 bg-[#141414] text-white rounded-xl font-medium hover:bg-black transition-colors"
        >
          Return to Properties List
        </button>
      </div>
    );
  }
  
  const {  images, imageUrls, agentInfo } = detailData;
  const status = String(property.status || "").toLowerCase();
  const isLive = status === "active" || status === "active_listing";
  const agencyName = property.agency?.name || agentInfo?.agency_name || "Unknown Agency";
  const agentName = property.agent?.name || agentInfo?.name || "Not Assigned";
  const createdAt = property.created_at ? new Date(property.created_at).toLocaleDateString() : "Unknown";
  const updatedAt = property.updated_at ? new Date(property.updated_at).toLocaleDateString() : "Unknown";
  
  return (
    <div className="space-y-6 font-sans text-[#141414] pb-12">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(n => <Toast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />)}
      </div>
      
      {/* Delete Property Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Property Permanently"
        message={`Are you absolutely sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        isLoading={deletePropertyMutation.isPending}
      />
      
      {/* Delete Image Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!imageToDelete}
        onClose={() => setImageToDelete(null)}
        onConfirm={confirmImageDelete}
        title="Delete Image"
        message="Are you sure you want to remove this image? This action cannot be undone."
        isLoading={deleteImageMutation.isPending}
      />
      
      {/* Header Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <button 
            onClick={() => navigate("/admin/properties")} 
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-1 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> 
            Back to Directory
          </button>
          {isEditing ? (
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
              className="text-2xl font-bold tracking-tight text-gray-900 bg-transparent border-b border-gray-300 focus:border-gray-900 focus:outline-none pb-1"
              placeholder="Property Title"
            />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{property.title}</h1>
          )}
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">ID: {property.id}</span>
            <span>•</span>
            <span>Created: {createdAt}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isEditing ? (
            <button 
              onClick={handleSaveChanges}
              disabled={updatePropertyMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {updatePropertyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {updatePropertyMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          ) : (
            <button 
              onClick={handleEditToggle}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
            >
              <Edit2 size={16} /> Edit Details
            </button>
          )}
          
          <button 
            onClick={handleDeleteClick}
            disabled={deletePropertyMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            <Trash2 size="16" /> 
            {deletePropertyMutation.isPending ? "Deleting..." : "Delete"}
          </button>
          
          {isLive ? (
            <button 
              onClick={() => updateStatusMutation.mutate("Suspended")}
              disabled={updateStatusMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {updateStatusMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} 
              Suspend
            </button>
          ) : (
            <button 
              onClick={() => updateStatusMutation.mutate("Active")}
              disabled={updateStatusMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {updateStatusMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
              Approve
            </button>
          )}
        </div>
      </div>
      
      {/* Media Section with Image Management */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-[21/9] rounded-2xl overflow-hidden border border-neutral-200 bg-gray-100 group">
          {images && images.length > 0 ? (
            <img 
              src={images[0]} 
              alt={property.title || "Property"} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <ImageIcon size={48} className="text-gray-400" />
              <p className="text-gray-500 ml-2">No image available</p>
            </div>
          )}
          
          {/* Image Upload Overlay */}
          {isEditing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="imageUploadInput"
              />
              <label
                htmlFor="imageUploadInput"
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {uploadImagesMutation.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                {uploadImagesMutation.isPending ? "Uploading..." : "Add Images"}
              </label>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 ${
              isLive ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}>
              {isLive ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              {isLive ? "ACTIVE" : "SUSPENDED"}
            </span>
          </div>
        </div>
        
        {/* Image Gallery Thumbnails */}
        {images && images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative group/image flex-shrink-0">
                <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-neutral-200 hover:border-gray-400 transition-colors">
                  <img 
                    src={img} 
                    alt={`Thumbnail ${idx + 1}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200";
                    }}
                  />
                </div>
                {isEditing && idx !== 0 && imageUrls && imageUrls[idx] && (
                  <button
                    onClick={() => handleImageDelete(imageUrls[idx], idx)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  >
                    <TrashIcon size={12} />
                  </button>
                )}
                {idx === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 font-medium">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Upload Status */}
        {uploadImagesMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <Loader2 size={16} className="animate-spin" />
            <span>Uploading images, please wait...</span>
          </div>
        )}
      </div>
      
      {/* Main Content Grid - Same as before */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Property Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Specs Card */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Home size={14} /> Property Specifications
            </h3>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Full Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Bedrooms</label>
                    <input
                      type="number"
                      value={editForm.bedrooms}
                      onChange={(e) => setEditForm({...editForm, bedrooms: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Bathrooms</label>
                    <input
                      type="number"
                      value={editForm.baths}
                      onChange={(e) => setEditForm({...editForm, baths: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Square Feet</label>
                    <input
                      type="number"
                      value={editForm.sqft}
                      onChange={(e) => setEditForm({...editForm, sqft: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={5}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:outline-none resize-none"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editForm.amenities.map((amenity, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs flex items-center gap-1">
                        {amenity}
                        <button onClick={() => handleRemoveAmenity(amenity)} className="hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddAmenity()}
                      className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:outline-none text-sm"
                      placeholder="Add amenity (e.g., Swimming Pool)"
                    />
                    <button
                      onClick={handleAddAmenity}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Price</span>
                    <p className="text-base font-black text-gray-900 mt-0.5">{formatCurrency(Number(property.price || 0))}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Bedrooms</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5 flex items-center gap-1"><Bed size={14} /> {property.bedrooms || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Bathrooms</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5 flex items-center gap-1"><Bath size={14} /> {property.baths || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Area</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5 flex items-center gap-1"><Maximize2 size={14} /> {property.sqft?.toLocaleString() || "-"} sqft</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1"><MapPin size={12} /> Location</span>
                    <p className="text-sm font-medium text-gray-700 mt-1">{property.location || "Not specified"}</p>
                  </div>
                  
                  {property.address && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Full Address</span>
                      <p className="text-sm text-gray-600 mt-1">{property.address}</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Description</span>
                  <p className="text-sm text-gray-600 leading-relaxed mt-2 whitespace-pre-wrap">
                    {property.description || "No description provided."}
                  </p>
                </div>
                
                {property.amenities && property.amenities.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Amenities</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {property.amenities.map((amenity: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Right Column - Admin Controls & Info */}
        <div className="space-y-6">
          {/* Compliance & Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Compliance Status</h3>
            
            <div className="flex items-center gap-2 mb-4">
              {isEditing ? (
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              ) : (
                <span className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-bold ${
                  isLive ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
                }`}>
                  {isLive ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  {isLive ? "Verified & Active" : "Suspended / Under Review"}
                </span>
              )}
            </div>
            
            <div className="space-y-3 text-xs border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Property ID:</span>
                <span className="font-mono font-bold text-gray-800">{property.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-800">{createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Modified:</span>
                <span className="text-gray-800">{updatedAt}</span>
              </div>
            </div>
          </div>
          
          {/* Agency & Agent Information Card */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building size={14} /> Ownership & Management
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Agency</span>
                <p className="text-sm font-semibold text-gray-900 mt-1">{agencyName}</p>
              </div>
              
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1"><User size={10} /> Assigned Agent</span>
                <p className="text-sm font-medium text-gray-800 mt-1">{agentName}</p>
                {agentInfo?.email && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={10} /> {agentInfo.email}</p>
                )}
                {agentInfo?.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={10} /> {agentInfo.phone}</p>
                )}
              </div>
              
              {agentsData && agentsData.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Reassign to Agent</label>
                  <select 
                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:outline-none"
                    onChange={(e) => {
                      if (e.target.value && property.id) {
                        reassignPropertyMutation.mutate({ 
                          propertyId: property.id, 
                          agentId: e.target.value 
                        });
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Select an agent...</option>
                    {agentsData.map((agent: any) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} - {agent.email}
                      </option>
                    ))}
                  </select>
                  {reassignPropertyMutation.isPending && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Loader2 size={12} className="animate-spin" /> Reassigning...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="mt-8 border-t-2 border-red-200 pt-6">
        <div className="bg-red-50/30 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-600" />
            <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider">Danger Zone</h3>
          </div>
          <p className="text-sm text-red-600 mb-4">
            Permanently delete this property and all associated data. This action cannot be undone.
          </p>
        <button
  onClick={() => {
    // 1. Force the use of the permanent wipe mutation
    if (window.confirm("ARE YOU SURE? This will permanently erase the property and all images. This cannot be undone.")) {
      forceDeleteMutation.mutate(property.id);
    }
  }}
  disabled={forceDeleteMutation.isPending}
  className="px-4 py-2 bg-red-700 hover:bg-red-900 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
>
  <Trash2 size={14} />
  {/* 2. Bind the text state to the correct mutation */}
  {forceDeleteMutation.isPending ? "Wiping Data..." : "Permanently Delete All Data"}
</button>
        </div>
      </div>
    </div>
  );
};