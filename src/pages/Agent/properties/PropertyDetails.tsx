import React, { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import {
  ArrowLeft, MapPin, Bed, Bath, Maximize2, CheckCircle, Download, Loader2, Send, 
  X, AlertCircle, Check, Info, Edit2, Save, Image as ImageIcon
} from "lucide-react";
import { formatCurrency, cn } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties";
import { vaultApi } from "../../../api/vault";
import { api } from "../../../lib/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ToastNotification { id: string; type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string; }

const Toast: React.FC<{ notification: ToastNotification; onClose: () => void }> = ({ notification, onClose }) => {
  React.useEffect(() => { const timer = setTimeout(() => { onClose(); }, 5000); return () => clearTimeout(timer); }, [onClose]);
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

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const brochureRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
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

      if (Array.isArray(propertyData)) {
        propertyData = propertyData[0];
      }

      if (!propertyData || Object.keys(propertyData).length === 0) {
        throw new Error("Property payload is empty");
      }

      const rawImages = propertyData.images || [];
      const realImageUrls = Array.isArray(rawImages)
        ? rawImages
            .map((img: any) => typeof img === 'object' ? img.s3_path || img.url : img)
            .filter(Boolean)
        : [];

      // FIX: Synchronously generate public URLs without network delays
      const processedUrls = realImageUrls.map((url: string) => {
        // 1. If it's already a full HTTP URL, use it directly
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        
        // 2. Generate the public URL instantly using the correct bucket
        const { data } = supabase.storage.from('user-files').getPublicUrl(url);
        
        return data.publicUrl;
      });

      // Filter out any potential empty strings
      const validUrls = processedUrls.filter(Boolean) as string[];
      
      const imagesToDisplay = validUrls.length > 0
          ? validUrls
          : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200"];

      return { property: propertyData, signedImages: imagesToDisplay };
    },
    enabled: !!id,
    retry: 1
  });

  const property = cacheData?.property;
  const signedImages = cacheData?.signedImages || [];

  const handleEditToggle = () => {
    if (!isEditing && property) {
      setEditForm({
        title: property.title || "",
        price: property.price?.toString() || "",
        location: property.location || "",
        bedrooms: property.bedrooms?.toString() || "",
        baths: property.baths?.toString() || "",
        sqft: property.sqft?.toString() || "",
        description: property.description || "",
        status: property.status || "active"
      });
    }
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!property) throw new Error("Property context is missing");
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
      if (!property) throw new Error("Property context is missing");
      const s3Path = await vaultApi.executeSecureUpload(file, 'property_image');
      return propertyApi.attachImage(property.id, s3Path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] });
      addNotification('success', 'Image Uploaded', 'Imagery updated successfully.');
      if (imageInputRef.current) imageInputRef.current.value = '';
    },
    onError: () => addNotification('error', 'Upload Failed', 'Failed to upload image.')
  });

  const leadMutation = useMutation({
    mutationFn: (leadData: any) => api.post('/leads', leadData),
    onSuccess: () => {
      setLeadSuccess(true);
      addNotification('success', 'Offer Submitted!', 'Sent to pipeline.');
      setCustomerName(""); setCustomerEmail(""); setCustomerPhone(""); setOfferAmount("");
    },
    onError: () => addNotification('error', 'Submission Failed', 'Check connection.')
  });

  const handleSaveChanges = () => {
    updateMutation.mutate({
      title: editForm.title, price: Number(editForm.price), location: editForm.location,
      bedrooms: Number(editForm.bedrooms), baths: Number(editForm.baths), sqft: Number(editForm.sqft),
      description: editForm.description, status: editForm.status
    });
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
        <Link to="/agent/properties" className="px-6 py-3 bg-[#141414] text-white rounded-xl font-medium hover:bg-black transition-colors">Back to Listings</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 font-sans" ref={brochureRef}>
      <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4">
        {notifications.map(n => <Toast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />)}
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" data-html2canvas-ignore>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#141414] transition-colors">
          <ArrowLeft size={16} /> Back to Listings
        </button>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              {/* FIX: Cancel Button Added */}
              <button 
                onClick={handleCancelEdit} 
                className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges} 
                disabled={updateMutation.isPending} 
                className="flex items-center gap-2 px-4 py-2.5 bg-[#141414] text-white rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-70"
              >
                {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button onClick={handleEditToggle} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Edit2 size={16} /> Edit Details
            </button>
          )}
          <button onClick={generatePDFBrochure} disabled={isGeneratingPDF} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Brochure
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 aspect-[21/9] bg-gray-100 rounded-[2rem] overflow-hidden relative group">
          <img src={signedImages[0]} className="w-full h-full object-cover" alt={property.title || "Property Cover"} crossOrigin="anonymous" />
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button onClick={() => imageInputRef.current?.click()} disabled={uploadImageMutation.isPending} className="flex items-center gap-2 px-6 py-3 bg-white text-[#141414] rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
                {uploadImageMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />} Change Main Image
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            {isEditing ? (
              <div className="space-y-6">
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
                  <textarea id="description" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={5} className="w-full border border-gray-200 text-[#141414] rounded-lg p-4 focus:ring-1 focus:ring-[#141414] focus:outline-none" placeholder="Describe the property's key features, neighborhood, etc."></textarea>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-3xl font-black text-[#141414] mb-2">{property.title || "Untitled Property"}</h1>
                  <p className="text-gray-500 flex items-center gap-2"><MapPin size={16} /> {property.location || "Location not specified"}</p>
                </div>
                <div className="flex gap-6 py-6 border-y border-gray-100">
                  <div className="flex items-center gap-2"><Bed className="text-gray-400" /> <span className="font-bold text-[#141414]">{property.bedrooms || "-"} Beds</span></div>
                  <div className="flex items-center gap-2"><Bath className="text-gray-400" /> <span className="font-bold text-[#141414]">{property.baths || "-"} Baths</span></div>
                  <div className="flex items-center gap-2"><Maximize2 className="text-gray-400" /> <span className="font-bold text-[#141414]">{property.sqft ? property.sqft.toLocaleString() : "-"} Sqft</span></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#141414] mb-3">About this property</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description || "No description provided."}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6" data-html2canvas-ignore>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Asking Price</p>
            {isEditing ? (
               <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="w-full text-3xl font-black border-b border-gray-200 focus:outline-none pb-2 mb-6 text-[#141414]" placeholder="Enter price" />
            ) : (
               <h2 className="text-4xl font-black text-[#141414] mb-6">{formatCurrency(Number(property.price || 0))}</h2>
            )}
            
            {!leadSuccess ? (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <input required type="text" placeholder="Client Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-3 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#141414] focus:outline-none transition-all" />
                <input required type="email" placeholder="Client Email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full p-3 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#141414] focus:outline-none transition-all" />
                <input required type="tel" placeholder="Client Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full p-3 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#141414] focus:outline-none transition-all" />
                <input type="number" placeholder="Offer Amount (Optional)" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} className="w-full p-3 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#141414] focus:outline-none transition-all" />
                
                <button type="submit" disabled={leadMutation.isPending} className="w-full py-4 bg-[#141414] text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                  {leadMutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={18} />} Log Offer
                </button>
              </form>
            ) : (
              <div className="bg-green-50 text-green-700 p-6 rounded-xl flex flex-col items-center text-center gap-3 border border-green-200">
                <CheckCircle size={32} />
                <p className="font-bold">Offer Logged Successfully</p>
                <button onClick={() => setLeadSuccess(false)} className="text-sm font-semibold hover:underline mt-2">Submit another offer</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};