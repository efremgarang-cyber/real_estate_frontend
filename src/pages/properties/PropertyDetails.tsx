import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  Calendar, 
  CheckCircle,
  Phone,
  Mail,
  Download,
  Share2,
  Lock,
  Loader2,
  FileText,
  Plus
} from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../lib/AuthContext";
import { leadApi } from "../../api/leads"; // Updated import

const properties = [
  { 
    id: "1", 
    title: "Vasant Vihar Estate", 
    price: 32000000, 
    location: "Karen, Nairobi", 
    status: "Active",
    beds: 4, 
    baths: 3, 
    sqft: 3400,
    expirationDate: "2024-12-01",
    description: "A stunning 4-bedroom villa located in the heart of Karen. This property features a spacious garden, modern finishes, and top-tier security. Perfect for families seeking a quiet and luxurious lifestyle.",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
      "https://images.unsplash.com/photo-1600607687940-4e524cb35797?q=80&w=800"
    ],
    amenities: ["Borehole", "Electric Fence", "Generator", "SQ", "Swimming Pool"],
    agent: {
      name: "Alex Mwendwa",
      email: "alex@vantage.com",
      phone: "+254 712 345 678",
      avatar: "https://i.pravatar.cc/150?u=alex"
    }
  },
  { 
    id: "2", 
    title: "Azure Residences", 
    price: 18500000, 
    location: "Kilimani, Nairobi", 
    status: "Sold",
    beds: 2, 
    baths: 2, 
    sqft: 1800,
    expirationDate: "2024-05-15",
    description: "Modern 2-bedroom apartment in Kilimani with panoramic city views. Features an open-plan kitchen, high-speed lifts, and a fully equipped gym. Ideally located near major shopping malls.",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200"
    ],
    amenities: ["Gym", "High Speed Lifts", "CCTV", "Balcony"],
    agent: {
      name: "Jane Doe",
      email: "jane@vantage.com",
      phone: "+254 722 000 111",
      avatar: "https://i.pravatar.cc/150?u=jane"
    }
  },
  { 
    id: "3", 
    title: "Hilltop Meadows", 
    price: 12000000, 
    location: "Naivasha, Kenya", 
    status: "Active",
    beds: 0, 
    baths: 0, 
    sqft: 43560, 
    expirationDate: "2025-01-10",
    description: "1 acre of prime agricultural land in Naivasha. Red soil, gentle slope, and accessible via all-weather roads. Near established flower farms with great potential for subdivision or resort development.",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200"
    ],
    amenities: ["Red Soil", "Near Road", "Water Connection"],
    agent: {
      name: "Alex Mwendwa",
      email: "alex@vantage.com",
      phone: "+254 712 345 678",
      avatar: "https://i.pravatar.cc/150?u=alex"
    }
  }
];

export const PropertyDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [isInitiating, setIsInitiating] = useState(false);
  const [success, setSuccess] = useState(false);

  const property = properties.find((p) => p.id === id);

  // Auto-Unlisting Logic helper
  const isExpired = property ? new Date(property.expirationDate) < new Date() : false;
  const isNearExpiry = property ? (new Date(property.expirationDate).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

  const handleInitiatePurchase = async () => {
    if (!profile || !property) return;
    
    setIsInitiating(true);
    try {
      // Updated to use the new leadApi
      await leadApi.create({
        agency_id: profile.agencyId,
        name: `Lead for ${property.title}`,
        kanban_stage: "contacted",
        email: user?.email || "anonymous@buyer.com",
        agent_id: profile.id,
        budgetMin: property.price,
        budgetMax: property.price * 1.1,
        desiredBedrooms: property.beds,
        requirements: { propertyId: property.id, price: property.price }
      } as any); // Cast as any if your CreateLeadPayload interface differs slightly from the old service payload
      
      setSuccess(true);
      setTimeout(() => {
        navigate("/leads");
      }, 2000);
    } catch (error) {
      console.error("Failed to initiate purchase:", error);
    } finally {
      setIsInitiating(false);
    }
  };

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <h2 className="text-2xl font-black uppercase mb-4">Property Not Found</h2>
        <Link to="/properties" className="btn-primary">Back to Listings</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Success Modal Overlay */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#141414]/90 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="dashboard-card bg-white max-w-sm w-full text-center p-12"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-2 italic">Lead Created</h3>
              <p className="text-sm text-gray-500 font-mono uppercase italic mb-8">Redirecting to lead pipeline...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link to="/properties" className="flex items-center gap-2 text-sm font-mono uppercase italic hover:underline">
          <ArrowLeft size={16} /> Back to Listings
        </Link>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2 text-xs">
            <Share2 size={14} /> Share
          </button>
          <button className="btn-primary flex items-center gap-2 text-xs">
            <Download size={14} /> Brochure
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 aspect-video bg-gray-200 border border-[#141414] overflow-hidden">
              <img 
                src={property.images[0]} 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                alt={property.title} 
              />
            </div>
            {property.images.slice(1).map((img, i) => (
              <div key={i} className="aspect-video bg-gray-200 border border-[#141414] overflow-hidden">
                <img 
                  src={img} 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                  alt={`${property.title} extra`} 
                />
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="dashboard-card">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">{property.title}</h1>
                <p className="text-sm font-mono text-gray-500 uppercase flex items-center gap-2 italic">
                  <MapPin size={14} /> {property.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">{formatCurrency(property.price)}</p>
                <span className={cn(
                  "inline-block mt-2 text-[10px] px-2 py-1 font-mono uppercase italic border border-[#141414]",
                  property.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {property.status} Listing
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gray-50 border border-[#141414] border-dashed mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-gray-400 uppercase mb-1 italic">Beds</span>
                <div className="flex items-center gap-2 font-bold">
                  <Bed size={18} /> {property.beds || "-"}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-gray-400 uppercase mb-1 italic">Baths</span>
                <div className="flex items-center gap-2 font-bold">
                  <Bath size={18} /> {property.baths || "-"}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-gray-400 uppercase mb-1 italic">Area</span>
                <div className="flex items-center gap-2 font-bold italic">
                  <Maximize2 size={18} /> {property.sqft.toLocaleString()} <span className="text-xs font-mono">SQFT</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-gray-400 uppercase mb-1 italic">Contract Expiry</span>
                <div className={cn(
                  "flex items-center gap-2 font-bold italic",
                  isExpired ? "text-red-500" : isNearExpiry ? "text-orange-500" : "text-inherit"
                )}>
                  <Calendar size={18} /> {property.expirationDate}
                </div>
              </div>
            </div>

            {isNearExpiry && !isExpired && (
              <div className="mb-8 p-4 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-mono uppercase italic flex items-center gap-3">
                <div className="p-2 bg-orange-200">
                  <Calendar size={16} />
                </div>
                <span>Warning: Smart Listing Engine alert - Contract expires in less than 7 days. Automatic unlisting scheduled.</span>
              </div>
            )}

            {isExpired && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-mono uppercase italic flex items-center gap-3">
                <div className="p-2 bg-red-200">
                  <Calendar size={16} />
                </div>
                <span>System Notice: Property is EXPIRED. Listing has been automatically hidden from public frontends.</span>
              </div>
            )}

            <div>
              <h3 className="text-sm font-mono uppercase text-gray-500 mb-4 italic">Description</h3>
              <p className="text-gray-700 leading-relaxed max-w-none">{property.description}</p>
            </div>

            <div className="mt-10">
              <h3 className="text-sm font-mono uppercase text-gray-500 mb-6 italic">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4">
                {(property as any).amenities?.map((amenity: string) => (
                  <div key={amenity} className="flex items-center gap-3 text-sm font-bold">
                    <CheckCircle size={16} className="text-green-600" />
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Card */}
          <div className="dashboard-card">
            <h3 className="text-[10px] font-mono text-gray-500 uppercase mb-6 italic">Listing Agent</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-[#141414]">
                <img src={property.agent.avatar} className="w-full h-full object-cover" alt={property.agent.name} />
              </div>
              <div>
                <p className="font-bold text-lg">{property.agent.name}</p>
                <p className="text-[10px] font-mono text-gray-400 uppercase italic">Verified Professional</p>
              </div>
            </div>
            <div className="space-y-3">
              <button className="btn-secondary w-full flex items-center justify-center gap-3 text-sm py-3">
                <Phone size={16} /> Contact Agent
              </button>
              <button className="btn-secondary w-full flex items-center justify-center gap-3 text-sm py-3">
                <Mail size={16} /> Send Email
              </button>
              
              <div className="pt-4 border-t border-gray-100">
                <button className="w-full btn-primary bg-blue-600 border-blue-700 hover:bg-blue-700 hover:shadow-none flex items-center justify-center gap-3 text-xs py-3">
                  <FileText size={16} /> Request DocuSign
                </button>
                <p className="text-[9px] font-mono text-center text-gray-400 mt-2 uppercase italic">Powered by Vantage Legal Engine</p>
              </div>
            </div>
          </div>

          {/* Secure Vault Info */}
          <div className="dashboard-card border-dashed">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 border border-[#141414]">
                <Lock size={18} />
              </div>
              <h3 className="font-bold uppercase text-xs italic">Title Deed Verification</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">Documentation for this property is locked in the Vantage Secure Vault. Agents: Upload Title Deed to initiate verification.</p>
            
            <div className="space-y-2">
              <button 
                onClick={() => navigate("/vault")}
                className="w-full btn-secondary text-[10px] flex items-center justify-center gap-2 py-2"
              >
                <Plus size={14} /> Upload to Vault
              </button>
              <div className="bg-gray-100 p-2 border border-[#141414]/10 text-[10px] font-mono uppercase italic text-center text-gray-400">
                Vault Status: Pending Verification
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="dashboard-card bg-[#141414] text-[#E4E3E0] shadow-[8px_8px_0px_0px_rgba(20,20,20,0.2)]">
            <h3 className="text-xl font-black uppercase mb-4 italic">Start Transaction</h3>
            <p className="text-xs font-mono opacity-60 mb-8 italic">Interested in this property? Initiate the purchase process through our secure platform.</p>
            <button 
              disabled={isInitiating || success}
              onClick={handleInitiatePurchase}
              className="w-full bg-[#E4E3E0] text-[#141414] py-4 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isInitiating && <Loader2 size={16} className="animate-spin" />}
              {isInitiating ? "Initializing..." : "Initiate Purchase"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};