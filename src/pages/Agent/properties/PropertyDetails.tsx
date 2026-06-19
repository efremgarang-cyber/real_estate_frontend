import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import {
  ArrowLeft, MapPin, Bed, Bath, Maximize2, CheckCircle, Download, Loader2, Send, 
  X, AlertCircle, Check, Info, Edit2, Save, Image as ImageIcon, Play, Square, Check as CheckIcon,
  Trash2, Upload, TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Bot
} from "lucide-react";
import { formatCurrency, cn } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties";
import { vaultApi } from "../../../api/vault";
import { api } from "../../../lib/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ToastNotification { id: string; type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string; }

const Toast: React.FC<{ notification: ToastNotification; onClose: () => void }> = ({ notification, onClose }) => {
  React.useEffect(() => { 
    const timer = setTimeout(() => { onClose(); }, 5000); 
    return () => clearTimeout(timer); 
  }, [onClose]);

  const icons = { success: <Check className="w-5 h-5 text-green-600" />, error: <AlertCircle className="w-5 h-5 text-red-600" />, warning: <AlertCircle className="w-5 h-5 text-orange-600" />, info: <Info className="w-5 h-5 text-blue-600" /> };
  const colors = { success: "bg-green-50 border-green-200", error: "bg-red-50 border-red-200", warning: "bg-orange-50 border-orange-200", info: "bg-blue-50 border-blue-200" };
  
  return (
    <div className={`fixed top-4 right-4 z-[200] w-96 rounded-xl border shadow-lg ${colors[notification.type]} animate-in slide-in-from-top-2 duration-300`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{icons[notification.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
            <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
          </div>
          <button title="Close notification" onClick={onClose} className="cursor-pointer flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Robust Media Resolver
const resolveMediaSource = (media: any): string => {
  if (!media) return "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200";
  
  const rawUrl = typeof media === 'string' ? media : (media.signed_url || media.s3_path || media.url);
  if (!rawUrl) return "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200";

  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) return rawUrl;

  const { data } = supabase.storage.from('user-files').getPublicUrl(rawUrl);
  return data.publicUrl;
};

// --- NEW ROI ASSESSMENT WIDGET ---
interface RoiForecast {
  estimated_annual_roi_percent: number;
  estimated_rental_yield_percent: number;
  estimated_appreciation_percent: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  comparable_basis: string;
}

export const RoiAssessmentWidget: React.FC<{ property: any }> = ({ property }) => {
  const [forecast, setForecast] = useState<RoiForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoi = async () => {
      try {
        const payload = {
          property_id: property.id,
          property_title: property.title,
          location: property.location || property.city,
          price: property.price,
          property_type: property.type || "Apartment",
          comparable_listings: [] 
        };
        
        console.log("1. Sending ROI Payload to Laravel:", payload);

        const response = await api.post('/properties/predict-roi', payload);
        
        console.log("2. Success! Received ROI Data:", response.data);
        setForecast(response.data);
        
      } catch (err: any) {
        console.error("X. ROI Request Failed!");
        console.error("Full Error Object:", err);

        // Check if the error came back from the Laravel server
        if (err.response) {
          console.error("Server Status:", err.response.status);
          console.error("Server Response Data:", err.response.data);
          
          // Extract Laravel's exact error message or validation errors to show in the UI
          const backendMessage = err.response.data?.message || err.response.data?.error || "Server error";
          const validationErrors = err.response.data?.errors ? JSON.stringify(err.response.data.errors) : "";
          
          setError(`Error: ${backendMessage} ${validationErrors}`);
        } 
        // Check if the request never made it to the server (Network error / CORS)
        else if (err.request) {
          console.error("No response received from server. Request details:", err.request);
          setError("Network error: Could not reach the server.");
        } 
        // Standard fallback
        else {
          setError(`Failed to generate AI financial forecast: ${err.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (property?.id) fetchRoi();
  }, [property]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-[2rem] border border-gray-300 p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Running Market Analysis...</p>
      </div>
    );
  }

  if (error || !forecast) {
    return (
      <div className="bg-white rounded-[2rem] border border-gray-300 p-6">
        <p className="text-sm font-medium text-gray-500">{error || "Analysis unavailable."}</p>
      </div>
    );
  }

  const ConfidenceIcon = 
    forecast.confidence === "high" ? CheckCircle2 : 
    forecast.confidence === "medium" ? BarChart3 : AlertTriangle;

  const confidenceColor = 
    forecast.confidence === "high" ? "text-green-600" : 
    forecast.confidence === "medium" ? "text-amber-600" : "text-gray-500";

  return (
    <div className="bg-white rounded-[2rem] border border-gray-300 shadow-sm overflow-hidden flex flex-col">
      {/* Dark Header */}
      <div className="bg-[#141414] p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Bot size={20} className="text-white" />
          <h3 className="text-base font-bold text-white">AI Market Estimate</h3>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Confidence:</span>
          <span className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-1", confidenceColor)}>
            <ConfidenceIcon size={12} /> {forecast.confidence}
          </span>
        </div>
      </div>

      <div className="p-6 lg:p-8 flex-1 flex flex-col gap-6">
        
        {/* Warning Banner for Low Confidence (Option 1 State) */}
        {forecast.confidence === 'low' && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              <strong>Estimation Caveat:</strong> This forecast is based on generalized market patterns. It is not currently backed by verified local comparable sales. Use as a directional guide only.
            </p>
          </div>
        )}

        {/* Top Metrics Row - Using Tildes for Approximation */}
        <div className="grid grid-cols-3 gap-6 pb-6 border-b border-gray-300">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Projected ROI</p>
            <p className="text-3xl font-bold text-[#141414] flex items-center gap-2">
              ~{forecast.estimated_annual_roi_percent}%
              <TrendingUp size={20} className="text-gray-400" />
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Rental Yield</p>
            <p className="text-2xl font-bold text-gray-600">~{forecast.estimated_rental_yield_percent}%</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Appreciation</p>
            <p className="text-2xl font-bold text-gray-600">~{forecast.estimated_appreciation_percent}%</p>
          </div>
        </div>

        {/* Reasoning Block */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#141414] mb-3">Analyst Reasoning</h4>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {forecast.reasoning}
          </p>
        </div>

        {/* Comparable Basis Block */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-300 mt-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#141414] mb-2">Data Grounding</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            {forecast.comparable_basis}
          </p>
        </div>

      </div>
    </div>
  );
};
// --- END ROI ASSESSMENT WIDGET ---

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const brochureRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeMedia, setActiveMedia] = useState<string>("");
  
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
    const notifId = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id: notifId, type, title, message }]);
  };
  const removeNotification = (notifId: string) => setNotifications(prev => prev.filter(n => n.id !== notifId));

  const generatePDFBrochure = async () => {
    if (!brochureRef.current || !property) return;
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(brochureRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${property.title.replace(/\s+/g, '_')}_Brochure.pdf`);
      addNotification('success', 'PDF Generated', 'Brochure downloaded successfully.');
    } catch (error) {
      addNotification('error', 'Generation Failed', 'Could not create PDF brochure.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const { data: cacheData, isLoading, isError } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await propertyApi.getById(id);
      let propertyData = response?.data || response;
      if (Array.isArray(propertyData)) propertyData = propertyData[0];

      if (!propertyData || Object.keys(propertyData).length === 0) {
        throw new Error("Property payload is empty");
      }

      // Track raw paths for accurate deletion mapping
      let rawImages: any = propertyData.images || [];
      let mediaItems: { path: string, url: string, isMain: boolean }[] = [];

      if (Array.isArray(rawImages)) {
        rawImages.forEach(p => mediaItems.push({ path: p, url: resolveMediaSource(p), isMain: false }));
      } else if (rawImages !== null && typeof rawImages === 'object') {
        if (rawImages.main) {
          mediaItems.push({ path: rawImages.main, url: resolveMediaSource(rawImages.main), isMain: true });
        }
        if (Array.isArray(rawImages.interior)) {
          rawImages.interior.forEach((p: string) => mediaItems.push({ path: p, url: resolveMediaSource(p), isMain: false }));
        }
        if (Array.isArray(rawImages.exterior)) {
          rawImages.exterior.forEach((p: string) => mediaItems.push({ path: p, url: resolveMediaSource(p), isMain: false }));
        }
      }

      return { property: propertyData, mediaItems };
    },
    enabled: !!id,
    retry: 1
  });

  const property = cacheData?.property;
  const mediaItems = cacheData?.mediaItems || [];
  const signedImages = mediaItems.map(m => m.url);

  useEffect(() => {
    if (signedImages.length > 0 && !activeMedia) {
      setActiveMedia(signedImages[0]);
    }
  }, [signedImages, activeMedia]);

  const handleEditToggle = () => {
    if (!isEditing && property) {
      setEditForm({
        title: property.title || "",
        price: property.price?.toString() || "",
        location: property.location || "",
        bedrooms: property.bedrooms?.toString() || "",
        baths: (property.baths)?.toString() || "",
        sqft: property.sqft?.toString() || "",
        description: property.description || "",
        status: property.status || "active"
      });
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => setIsEditing(false);

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!property) throw new Error("Missing property");
      return propertyApi.update(property.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] }); 
      addNotification('success', 'Property Updated', 'Details saved successfully.');
      setIsEditing(false);
    },
    onError: () => addNotification('error', 'Update Failed', 'Could not save changes.')
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!property) throw new Error("Missing property");
      const s3Path = await vaultApi.executeSecureUpload(file, 'property_image');
      return propertyApi.attachImage(property.id, s3Path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      addNotification('success', 'Image Uploaded', 'New image added to gallery.');
      if (imageInputRef.current) imageInputRef.current.value = '';
    },
    onError: () => addNotification('error', 'Upload Failed', 'Failed to upload image.')
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (s3Path: string) => {
      if (!property) throw new Error("Missing property");
      // Target direct backend deletion endpoint
      return api.delete(`/properties/${property.id}/images`, { data: { s3_path: s3Path } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      addNotification('success', 'Image Deleted', 'Image removed from property.');
    },
    onError: () => addNotification('error', 'Deletion Failed', 'Failed to remove image.')
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async () => {
      if (!property) throw new Error("Missing property");
      return propertyApi.delete(property.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      // Redirect back to properties portfolio view
      navigate('/agent/properties');
    },
    onError: () => addNotification('error', 'Deletion Failed', 'Could not delete the listing.')
  });

  const handleSaveChanges = () => {
    updateMutation.mutate({
      title: editForm.title, price: Number(editForm.price), location: editForm.location,
      bedrooms: Number(editForm.bedrooms), baths: Number(editForm.baths), sqft: Number(editForm.sqft),
      description: editForm.description, status: editForm.status
    });
  };

  const handleDeleteProperty = () => {
    if (window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      deletePropertyMutation.mutate();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !property) return;
    if (!file.type.startsWith('image/')) {
      addNotification('error', 'Invalid File', 'Upload a valid image.');
      return;
    }
    uploadImageMutation.mutate(file);
  };

  const leadMutation = useMutation({
    mutationFn: (leadData: any) => api.post('/leads', leadData),
    onSuccess: () => {
      setLeadSuccess(true);
      addNotification('success', 'Offer Submitted!', 'Sent to pipeline.');
      setCustomerName(""); 
      setCustomerEmail(""); 
      setCustomerPhone(""); 
      setOfferAmount("");
    },
    onError: () => addNotification('error', 'Submission Failed', 'Check connection.')
  });

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    leadMutation.mutate({
      name: customerName, email: customerEmail, phone: customerPhone,
      value: parseFloat(offerAmount || property.price || "0"), property_id: property.id, kanban_stage: 'new'
    });
  };

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
        <Link to="/agent/properties" className="cursor-pointer px-6 py-3 bg-[#141414] text-white rounded-xl font-medium hover:bg-black transition-colors">Back to Listings</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 font-sans" ref={brochureRef}>
      <div className="fixed top-0 right-0 z-[150] flex flex-col gap-2 p-4">
        {notifications.map(n => <Toast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />)}
      </div>
      
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-html2canvas-ignore>
        <button onClick={() => navigate(-1)} className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#141414] transition-colors">
          <ArrowLeft size={16} /> Back to Listings
        </button>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancelEdit} 
                className="cursor-pointer px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges} 
                disabled={updateMutation.isPending} 
                className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-[#141414] text-white rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-70"
              >
                {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleDeleteProperty} 
                disabled={deletePropertyMutation.isPending}
                className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {deletePropertyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} 
                Delete
              </button>
              <button onClick={handleEditToggle} className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                <Edit2 size={16} /> Edit Details
              </button>
            </>
          )}
          <button onClick={generatePDFBrochure} disabled={isGeneratingPDF} className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Brochure
          </button>
        </div>
      </div>

      {/* Main Display Viewer (Hidden in Edit Mode for cleaner flow) */}
      {!isEditing && (
        <div className="bg-white rounded-[1rem] border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row h-auto lg:h-[600px]">
            <div className="flex-1 bg-gray-100 relative group">
              {activeMedia && (activeMedia.includes("video") || activeMedia.includes("mp4")) ? (
                <div className="w-full h-full flex items-center justify-center bg-black text-white relative">
                  <video src={activeMedia} controls className="w-full h-full object-cover" />
                </div>
              ) : (
                <img src={activeMedia || signedImages[0]} alt="Property View" className="w-full h-full object-cover" crossOrigin="anonymous" />
              )}
            </div>
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white p-4 overflow-y-auto flex flex-row lg:flex-col gap-3 custom-scrollbar" data-html2canvas-ignore>
              <h3 className="hidden lg:block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Media Gallery</h3>
              {signedImages.map((mediaSource, index) => (
                <button
                  key={index}
                  onClick={() => setActiveMedia(mediaSource)}
                  className={cn("cursor-pointer relative w-24 lg:w-full h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all", activeMedia === mediaSource ? "border-[#141414]" : "border-transparent opacity-60 hover:opacity-100")}
                >
                  <img src={mediaSource} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  {(mediaSource.includes("video") || mediaSource.includes("mp4")) && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play size={16} className="text-white fill-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            {isEditing ? (
              <div className="space-y-8" data-html2canvas-ignore>
                <div className="space-y-6 pb-8 border-b border-gray-100">
                  <div>
                    <label htmlFor="title" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Property Title</label>
                    <input id="title" type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full text-2xl font-bold border-b border-gray-200 focus:outline-none pb-2 text-[#141414]" placeholder="e.g. Modern Villa in Kitisuru" />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Location</label>
                    <input id="location" type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full text-gray-700 border-b border-gray-200 focus:outline-none pb-2" placeholder="e.g. Kitisuru, Nairobi" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="bedrooms" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bedrooms</label>
                      <input id="bedrooms" type="number" value={editForm.bedrooms} onChange={e => setEditForm({...editForm, bedrooms: e.target.value})} placeholder="0" className="w-full border border-gray-200 text-[#141414] rounded-lg p-2 focus:ring-1 focus:ring-[#141414] focus:outline-none" />
                    </div>
                    <div>
                      <label htmlFor="baths" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bathrooms</label>
                      <input id="baths" type="number" value={editForm.baths} onChange={e => setEditForm({...editForm, baths: e.target.value})} placeholder="0" className="w-full border border-gray-200 text-[#141414] rounded-lg p-2 focus:ring-1 focus:ring-[#141414] focus:outline-none" />
                    </div>
                    <div>
                      <label htmlFor="sqft" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Square Footage</label>
                      <input id="sqft" type="number" value={editForm.sqft} onChange={e => setEditForm({...editForm, sqft: e.target.value})} placeholder="0" className="w-full border border-gray-200 text-[#141414] rounded-lg p-2 focus:ring-1 focus:ring-[#141414] focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Property Description</label>
                    <textarea id="description" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={5} className="w-full border border-gray-200 text-[#141414] rounded-lg p-4 focus:ring-1 focus:ring-[#141414] focus:outline-none custom-scrollbar" placeholder="Describe the property's key features, neighborhood, etc."></textarea>
                  </div>
                </div>

                {/* Media Manager Block */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#141414]">Manage Media Gallery</h3>
                    <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <button 
                      type="button" 
                      onClick={() => imageInputRef.current?.click()} 
                      disabled={uploadImageMutation.isPending}
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 text-[#141414] rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {uploadImageMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Add New Image
                    </button>
                  </div>

                  {mediaItems.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
                      <p className="text-sm font-medium text-gray-400">No images attached to this property.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {mediaItems.map((item, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                          <img src={item.url} alt={`Gallery Asset ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            {item.isMain && <span className="px-2 py-1 bg-[#141414] text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">Main Cover</span>}
                            <button 
                              type="button"
                              onClick={() => deleteImageMutation.mutate(item.path)}
                              disabled={deleteImageMutation.isPending}
                              className="cursor-pointer p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-transform hover:scale-110 disabled:opacity-50"
                              title="Delete Image"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-gray-100 text-[#141414] text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {"Listing"}
                    </span>
                    <span className={cn("px-3 py-1 border text-[10px] font-bold uppercase tracking-widest rounded-full", property.status === 'Active' ? "border-green-200 text-green-600 bg-green-50" : "border-gray-200 text-gray-500 bg-gray-50")}>
                      {property.status || "Active"}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-[#141414] leading-tight mb-2">
                    {property.title || "Untitled Property"}
                  </h1>
                  <p className="text-gray-500 flex items-center gap-2 font-medium">
                    <MapPin size={18} /> {property.location || "Location not specified"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 py-6 border-y border-gray-100">
                  <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
                    <Bed size={24} className="text-gray-400" />
                    <div>
                      <p className="text-2xl font-bold text-[#141414]">{property.bedrooms || "-"}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Bedrooms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pr-6 border-r border-gray-100">
                    <Bath size={24} className="text-gray-400" />
                    <div>
                      <p className="text-2xl font-bold text-[#141414]">{property.baths ?? "-"}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Bathrooms</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Square size={24} className="text-gray-400" />
                    <div>
                      <p className="text-2xl font-bold text-[#141414]">{property.sqft ? property.sqft.toLocaleString() : "-"}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Square Feet</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#141414] mb-4">Property Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {property.description || "No description provided."}
                  </p>
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-[#141414] mb-4">Amenities & Features</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                      {property.amenities.map((amenity: string, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                            <CheckIcon size={12} className="text-[#141414]" />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6" data-html2canvas-ignore>
          <div className="sticky top-24 space-y-6">
            
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Listed Price</p>
              {isEditing ? (
                 <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="w-full text-3xl font-black border-b border-gray-200 focus:outline-none pb-2 mb-8 text-[#141414]" placeholder="Enter price" />
              ) : (
                 <h2 className="text-4xl sm:text-5xl font-black text-[#141414] tracking-tight mb-8">
                   {formatCurrency(Number(property.price || 0))}
                 </h2>
              )}
              
              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-[#141414] mb-4">Log Direct Offer / Lead</h4>
                {!leadSuccess ? (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <input required type="text" placeholder="Client Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-3 border border-gray-200 text-[#141414] placeholder:text-gray-400 rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#141414] focus:outline-none transition-all text-sm font-medium" />
                    <input required type="email" placeholder="Client Email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full p-3 border border-gray-200 text-[#141414] placeholder:text-gray-400 rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#141414] focus:outline-none transition-all text-sm font-medium" />
                    <input required type="tel" placeholder="Client Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full p-3 border border-gray-200 text-[#141414] placeholder:text-gray-400 rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#141414] focus:outline-none transition-all text-sm font-medium" />
                    <input type="number" placeholder="Offer Amount (Optional)" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} className="w-full p-3 border border-gray-200 text-[#141414] placeholder:text-gray-400 rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#141414] focus:outline-none transition-all text-sm font-medium" />
                    
                    <button type="submit" disabled={leadMutation.isPending} className="cursor-pointer w-full py-3.5 bg-[#141414] text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm mt-2">
                      {leadMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Log Offer to Kanban
                    </button>
                  </form>
                ) : (
                  <div className="bg-green-50 text-green-700 p-6 rounded-xl flex flex-col items-center text-center gap-3 border border-green-200">
                    <CheckCircle size={32} />
                    <p className="font-bold">Offer Logged Successfully</p>
                    <button onClick={() => setLeadSuccess(false)} className="cursor-pointer text-sm font-semibold hover:underline mt-2">Submit another offer</button>
                  </div>
                )}
              </div>
            </div>

            {/* AI ROI Assessment Widget */}
            <RoiAssessmentWidget property={property} />

          </div>
        </div>
      </div>
    </div>
  );
};