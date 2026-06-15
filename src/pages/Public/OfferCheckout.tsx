import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, 
  Building2, ShieldCheck, MapPin, Send
} from "lucide-react";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase"; // <-- Imported Supabase

// Safely resolve the Supabase signed URL or public bucket URL
const resolveMediaSource = (media: any): string => {
  const fallback = "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=600";
  if (!media) return fallback;
  
  const rawUrl = typeof media === 'string' ? media : (media.signed_url || media.s3_path || media.url);
  if (!rawUrl) return fallback;

  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
    return rawUrl;
  }

  const { data } = supabase.storage.from('user-files').getPublicUrl(rawUrl);
  return data.publicUrl || fallback;
};

export const PublicOfferCheckout = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    offer_amount: "",
    message: ""
  });

  // Fetch the property summary context
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/properties/${id}`);
        setProperty(response.data?.data || response.data);
      } catch (error) {
        console.error("Failed to load property context:", error);
        setProperty(fallbackProperty);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setNotification(null);

    try {
      await api.post(`/leads`, {
        property_id: id,
        source: "Public Offer Form",
        contact_name: formData.name,
        contact_email: formData.email,
        contact_phone: formData.phone,
        estimated_value: formData.offer_amount,
        notes: `OFFER SUBMISSION: ${formData.message}`
      });

      setNotification({ type: "success", message: "Your offer has been submitted securely. An agent will contact you shortly." });
      
      setFormData({ name: "", email: "", phone: "", offer_amount: "", message: "" });
      
      setTimeout(() => navigate(`/properties/${id}`), 4000);
      
    } catch (error: any) {
      console.error("Offer dispatch failed:", error);
      const errMsg = error?.response?.data?.message || "We encountered a network issue submitting your offer. Please try again.";
      setNotification({ type: "error", message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to extract the best cover image from the property payload
  const getCoverImage = () => {
    if (!property?.images) return resolveMediaSource(null);
    
    let targetMedia = null;
    if (typeof property.images === 'object' && !Array.isArray(property.images)) {
      targetMedia = property.images.main || property.images.interior?.[0] || property.images.exterior?.[0];
    } else if (Array.isArray(property.images)) {
      targetMedia = property.images[0];
    }
    
    return resolveMediaSource(targetMedia);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] flex flex-col items-center justify-center text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p className="text-sm font-bold tracking-widest uppercase">Initializing Secure Checkout...</p>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] font-sans pb-24 text-[#141414] dark:text-white">
      
      {/* Minimal Header */}
      <header className="bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={`/properties/${id}`} className="cursor-pointer flex items-center gap-2 group text-gray-500 dark:text-gray-400 hover:text-[#141414] dark:hover:text-white transition-colors">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Cancel Offer</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-6 h-6 object-contain" />
            <h1 className="font-display text-lg font-bold text-[#141414] dark:text-white tracking-tight">MAKAO</h1>
          </div>
        </div>
      </header>

      {/* Global Notification Banner */}
      {notification && (
        <div className={cn(
          "px-8 py-4 border-b text-sm font-bold flex items-center justify-center gap-2 transition-all",
          notification.type === "success" 
            ? "bg-neutral-50 dark:bg-[#111111] border-gray-200 dark:border-gray-800 text-emerald-600 dark:text-emerald-400" 
            : "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400"
        )}>
          {notification.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Offer Form */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-[#141414] dark:text-white tracking-tight">Submit Your Offer</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
                Provide your details and proposition. No account required. The listing agency will contact you directly to negotiate or proceed with the paperwork.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#141414] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-100 dark:border-gray-900">1. Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
                    <input required id="name" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-[#141414] dark:text-white px-4 py-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-sm font-medium transition-colors" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input required id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full text-[#141414] dark:text-white px-4 py-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-sm font-medium transition-colors" placeholder="john@example.com" />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                  <input required id="phone" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full text-[#141414] dark:text-white px-4 py-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-sm font-medium transition-colors" placeholder="+254 700 000000" />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-100 dark:border-gray-900">2. Offer Details</h3>
                
                <div>
                  <label htmlFor="offer" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Your Offer Amount (KES)</label>
                  <input required id="offer" type="number" min="0" step="100000" value={formData.offer_amount} onChange={e => setFormData({...formData, offer_amount: e.target.value})} className="w-full text-xl text-[#141414] dark:text-white px-4 py-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-bold transition-colors" placeholder="e.g. 80000000" />
                </div>

                <div>
                  <label htmlFor="message" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Message / Terms (Optional)</label>
                  <textarea id="message" rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full text-[#141414] dark:text-white px-4 py-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-sm font-medium transition-colors resize-none custom-scrollbar" placeholder="Include any contingencies, preferred closing dates, or specific terms here." />
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer w-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing Offer...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Transmit Formal Offer
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">
                  By submitting, you agree to our terms of service.
                </p>
              </div>

            </form>
          </div>

          {/* Right Column: Property Summary */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-white dark:bg-[#141414] rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="h-48 bg-gray-100 dark:bg-black relative">
                  {/* Now mapping cleanly via getCoverImage() */}
                  <img src={getCoverImage()} alt="Property" className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#141414]/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                      Target Property
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[#141414] dark:text-white leading-tight mb-2">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-6">
                    <MapPin size={14} />
                    <span className="text-xs font-medium truncate">{property.address || property.location}</span>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-900">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Listed Price</p>
                    <p className="text-2xl font-black text-[#D4AF37] tracking-tight">
                      {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(property.price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-transparent border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="text-[#141414] dark:text-white shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-[#141414] dark:text-white">Secure Transmission</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your data is encrypted and sent directly to the verified listing agency.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 size={20} className="text-[#141414] dark:text-white shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-[#141414] dark:text-white">Direct Agency Contact</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">We bypass intermediaries to ensure your offer is viewed immediately.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// --- MOCK FALLBACK DATA ---
const fallbackProperty = {
  id: "prop-123",
  title: "Modern Architectural Villa in Runda",
  price: 85000000,
  address: "123 Runda Estate, Nairobi, Kenya",
  // Updated mock to match new structures
  images: {
    main: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=600"
  }
};