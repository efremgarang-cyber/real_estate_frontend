import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, Bed, Bath, Maximize2, Calendar, CheckCircle, 
  Phone, Mail, Download, Share2, Loader2, FileText, Send, Sparkles, 
  X, AlertCircle, Check, Info, Edit2, Save, Image as ImageIcon
} from "lucide-react";
import { formatCurrency, cn } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties";
import { vaultApi } from "../../../api/vault";
import { api } from "../../../lib/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// (Keep your Toast, ShareModal, ContactAgentModal, SendEmailModal, DocuSignModal and generatePDFBrochure exactly as they are here)
interface ToastNotification { id: string; type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string; }
const Toast: React.FC<{ notification: ToastNotification; onClose: () => void }> = ({ notification, onClose }) => {
  useEffect(() => { const timer = setTimeout(() => { onClose(); }, 5000); return () => clearTimeout(timer); }, [onClose]);
  const icons = { success: <Check className="w-5 h-5 text-green-600" />, error: <AlertCircle className="w-5 h-5 text-red-600" />, warning: <AlertCircle className="w-5 h-5 text-orange-600" />, info: <Info className="w-5 h-5 text-blue-600" /> };
  const colors = { success: "bg-green-50 border-green-200", error: "bg-red-50 border-red-200", warning: "bg-orange-50 border-orange-200", info: "bg-blue-50 border-blue-200" };
  return (
    <div className={`fixed top-4 right-4 z-50 w-96 rounded-xl border shadow-lg ${colors[notification.type]} animate-in slide-in-from-top-2 duration-300`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{icons[notification.type]}</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900">{notification.title}</p><p className="text-sm text-gray-600 mt-0.5">{notification.message}</p></div>
          <button title="Close notification" onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};

// ... include your existing Modals and generatePDFBrochure function ...

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDocuSignModalOpen, setIsDocuSignModalOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    title: "", price: "", location: "", bedrooms: "", baths: "", sqft: "", description: "", status: ""
  });

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [leadSuccess, setLeadSuccess] = useState(false);

  const addNotification = (type: ToastNotification['type'], title: string, message: string) => {
    const notifId = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id: notifId, type, title, message }]);
  };
  const removeNotification = (notifId: string) => setNotifications(prev => prev.filter(n => n.id !== notifId));

  // 1. Fetch & Cache Property Data
  const { data: cacheData, isLoading, isError } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await propertyApi.getById(id);
      const property = response.data;
      
      const rawImages = property.images || [];
      const realImageUrls = Array.isArray(rawImages) 
        ? rawImages.map((img: any) => typeof img === 'object' ? img.s3_path || img.url : img).filter(Boolean)
        : [];

      const signedUrls = await Promise.all(
        realImageUrls.map((url: string) => vaultApi.getSignedUrl(url))
      );
      
      const imagesToDisplay = signedUrls.length > 0 
        ? signedUrls 
        : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200"];

      return { property, signedImages: imagesToDisplay };
    },
    enabled: !!id
  });

  const property = cacheData?.property;
  const signedImages = cacheData?.signedImages || [];

  // Populate edit form when property loads
  useEffect(() => {
    if (property) {
      setOfferAmount(property.price?.toString() || "");
      setEditForm({
        title: property.title || "",
        price: property.price?.toString() || "",
        location: property.location || property.location || "",
        bedrooms: property.bedrooms?.toString() || property.bedrooms?.toString() || "",
        baths: property.baths?.toString() || property.baths?.toString() || "",
        sqft: property.sqft?.toString() || "",
        description: property.description || "",
        status: property.status || "active"
      });
    }
  }, [property]);

  // 2. Mutations
  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!property) throw new Error("Property context is missing");
      return propertyApi.update(property.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] }); 
      addNotification('success', 'Property Updated', 'The property details have been saved successfully.');
      setIsEditing(false);
    },
    onError: () => addNotification('error', 'Update Failed', 'Could not save changes to the property.')
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!property) throw new Error("Property context is missing");
      
      const s3Url = await vaultApi.executeSecureUpload(file, 'property_image');
      
      // FIX: Map existing images to guarantee they are flat strings before sending to the backend
      const existingImages = (property.images ?? []).map((img: any) => 
        typeof img === 'object' ? (img.s3_path || img.url) : img
      );
      
      const updatedImages = [s3Url, ...existingImages];
      return propertyApi.update(property.id, { images: updatedImages });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      addNotification('success', 'Image Uploaded', 'Property imagery updated successfully.');
      if (imageInputRef.current) imageInputRef.current.value = '';
    },
    onError: () => addNotification('error', 'Upload Failed', 'Failed to upload image to the secure vault.')
  });

  const leadMutation = useMutation({
    mutationFn: (leadData: any) => api.post('/leads', leadData),
    onSuccess: () => {
      setLeadSuccess(true);
      addNotification('success', 'Offer Submitted!', 'Your offer has been successfully sent to our pipeline.');
    },
    onError: () => addNotification('error', 'Submission Failed', 'Unable to submit your offer. Please check your connection.')
  });

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleSaveChanges = () => {
    updateMutation.mutate({
      title: editForm.title, price: Number(editForm.price), address: editForm.location,
      beds: Number(editForm.bedrooms), baths: Number(editForm.baths), sqft: Number(editForm.sqft),
      description: editForm.description, status: editForm.status
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !property) return;
    if (!file.type.startsWith('image/')) {
      addNotification('error', 'Invalid File', 'Please upload a valid image file.');
      return;
    }
    uploadImageMutation.mutate(file);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    leadMutation.mutate({
      name: customerName, email: customerEmail, phone: customerPhone,
      value: parseFloat(offerAmount), property_id: property.id, kanban_stage: 'new'
    });
  };

  // ... (Modal/Brochure handlers remain exactly the same) ...

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans space-y-4">
        <Loader2 size={32} className="animate-spin text-[#141414]" />
        <p className="text-sm font-medium text-gray-500">Retrieving secure vault data...</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="flex flex-col items-center justify-center p-12 font-sans">
        <h2 className="font-display text-2xl font-bold text-[#141414] mb-4">Property Not Found</h2>
        <Link to="/agent/properties" className="px-6 py-3 bg-[#141414] text-white rounded-xl font-medium hover:bg-black transition-colors">Back to Listings</Link>
      </div>
    );
  }

  const expirationDate = property.expires_at;
  const isExpired = expirationDate ? new Date(expirationDate) < new Date() : false;
  const isNearExpiry = expirationDate ? (new Date(expirationDate).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  const agent = property.agency_id || { name: "System Admin", email: "admin@vantage.com", phone: "+254700000000", avatar: "https://ui-avatars.com/api/?name=Admin&background=141414&color=fff" };
  const amenities = property.description || [];

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* ... Toast and Modals Mounts ... */}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link to="/agent/properties" className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#141414] transition-colors">
          <ArrowLeft size={16} /> Back to Listings
        </Link>
        <div className="flex gap-3">
          {isEditing ? (
            <button 
              onClick={handleSaveChanges} disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] text-white rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-70"
            >
              {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          ) : (
            <button 
              onClick={handleEditToggle}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={16} /> Edit Details
            </button>
          )}

          {/* ... Share / Download Buttons ... */}
        </div>
      </div>

      {/* Grid rendering (The rest of the JSX structurally mirrors your provided snippet exactly using signedImages[0]) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 aspect-[21/9] bg-gray-100 rounded-[2rem] overflow-hidden relative group">
          <img src={signedImages[0]} className="w-full h-full object-cover" alt={property.title} />
          
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button 
                onClick={() => imageInputRef.current?.click()} disabled={uploadImageMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-white text-[#141414] rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
              >
                {uploadImageMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                {uploadImageMutation.isPending ? "Uploading to S3..." : "Change Main Image"}
              </button>
            </div>
          )}
        </div>
        {signedImages.slice(1, 3).map((img: string, i: number) => (
          <div key={i} className="aspect-video bg-gray-100 rounded-[2rem] overflow-hidden">
            <img src={img} className="w-full h-full object-cover" alt={`extra ${i + 1}`} />
          </div>
        ))}
      </div>
      
      {/* ... Rest of your component (Edit forms, stats, Lead Submit Box using leadMutation.isPending) ... */}
    </div>
  );
};