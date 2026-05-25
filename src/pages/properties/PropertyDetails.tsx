import React, { useState, useEffect } from "react";
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
import { propertyApi } from "../../api/properties";
import { PropertyCard } from "../../components/PropertyCard";

export const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Asynchronous State Management
  const [property, setProperty] = useState<any>(null); // Type this to your actual Property interface
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await propertyApi.getById(id);
        setProperty(response.data);
      } catch (err) {
        console.error("Failed to fetch property:", err);
        setError("Failed to load property details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  // Loading State UI
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans space-y-4">
        <Loader2 size={32} className="animate-spin text-[#141414]" />
        <p className="text-sm font-medium text-gray-500">Retrieving secure vault data...</p>
      </div>
    );
  }

  // Error or Not Found UI
  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center p-12 font-sans">
        <h2 className="font-display text-2xl font-bold text-[#141414] mb-4">
          {error || "Property Not Found"}
        </h2>
        <Link to="/properties" className="px-6 py-3 bg-[#141414] text-white rounded-xl font-medium hover:bg-black transition-colors">
          Back to Listings
        </Link>
      </div>
    );
  }

  // Map API fields (Adjust these if your backend column names differ slightly)
  const expirationDate = property.contract_end_date || property.expirationDate;
  const isExpired = expirationDate ? new Date(expirationDate) < new Date() : false;
  const isNearExpiry = expirationDate ? (new Date(expirationDate).getTime() - new Date().getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

  // Fallbacks for UI safety in case the backend hasn't implemented these relations yet
  const images = property.images?.length > 0 ? property.images : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200"];
  const agent = property.agent || { name: "System Admin", avatar: "https://ui-avatars.com/api/?name=Admin&background=141414&color=fff" };
  const amenities = property.amenities || [];

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link to="/properties" className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#141414] transition-colors">
          <ArrowLeft size={16} /> Back to Listings
        </Link>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Share2 size={16} /> Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download size={16} /> Brochure
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 aspect-[21/9] bg-gray-100 rounded-[2rem] overflow-hidden">
              <img
                src={images[0]}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                alt={property.title}
              />
            </div>
            {images.slice(1, 3).map((img: string, i: number) => (
              <div key={i} className="aspect-video bg-gray-100 rounded-[2rem] overflow-hidden">
                <img
                  src={img}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  alt={`${property.title} extra ${i + 1}`}
                />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl font-bold text-[#141414] mb-2">{property.title}</h1>
                <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MapPin size={16} /> {property.location}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Asking Price</p>
                <p className="text-3xl font-bold text-[#141414] mb-2">{formatCurrency(property.price)}</p>
                <span className={cn(
                  "text-sm font-bold uppercase tracking-wider",
                  property.status === "active" || property.status === "Active" ? "text-green-600" : "text-gray-400"
                )}>
                  {property.status?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-2xl mb-8">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Beds</span>
                <div className="flex items-center gap-2 font-bold text-[#141414] text-lg">
                  <Bed size={20} className="text-gray-400" /> {property.beds || "-"}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Baths</span>
                <div className="flex items-center gap-2 font-bold text-[#141414] text-lg">
                  <Bath size={20} className="text-gray-400" /> {property.baths || "-"}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Area</span>
                <div className="flex items-center gap-2 font-bold text-[#141414] text-lg">
                  <Maximize2 size={20} className="text-gray-400" /> {property.sqft ? property.sqft.toLocaleString() : "-"} <span className="text-xs font-medium text-gray-500">SQFT</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Expiry</span>
                <div className={cn(
                  "flex items-center gap-2 font-bold text-lg",
                  isExpired ? "text-red-500" : isNearExpiry ? "text-orange-500" : "text-[#141414]"
                )}>
                  <Calendar size={20} className={isExpired ? "text-red-400" : isNearExpiry ? "text-orange-400" : "text-gray-400"} />
                  <span className="text-sm">{expirationDate || "Not Set"}</span>
                </div>
              </div>
            </div>

            {isNearExpiry && !isExpired && (
              <div className="mb-8 p-4 bg-orange-50 rounded-xl text-orange-800 text-sm font-medium flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar size={18} className="text-orange-600" />
                </div>
                <span>Warning: Smart Listing Engine alert - Contract expires in less than 7 days. Automatic unlisting scheduled.</span>
              </div>
            )}

            {isExpired && (
              <div className="mb-8 p-4 bg-red-50 rounded-xl text-red-800 text-sm font-medium flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar size={18} className="text-red-600" />
                </div>
                <span>System Notice: Property is EXPIRED. Listing has been automatically hidden from public frontends.</span>
              </div>
            )}

            <div>
              <h3 className="font-display text-xs font-semibold uppercase text-gray-400 tracking-wider mb-4">Description</h3>
              <p className="text-gray-600 leading-relaxed">{property.description || "No description provided."}</p>
            </div>

            {amenities.length > 0 && (
              <div className="mt-10">
                <h3 className="font-display text-xs font-semibold uppercase text-gray-400 tracking-wider mb-6">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5">
                  {amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center gap-3 text-sm font-medium text-[#141414]">
                      <CheckCircle size={18} className="text-gray-300" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
            <h3 className="font-display text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">Listing Agent</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                <img src={agent.avatar} className="w-full h-full object-cover" alt={agent.name} />
              </div>
              <div>
                <p className="font-bold text-[#141414] text-lg">{agent.name}</p>
                <p className="text-xs font-medium text-gray-500">Verified Professional</p>
              </div>
            </div>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 text-[#141414] rounded-xl text-sm font-medium transition-colors">
                <Phone size={18} /> Contact Agent
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 text-[#141414] rounded-xl text-sm font-medium transition-colors">
                <Mail size={18} /> Send Email
              </button>

              <div className="pt-4 mt-2 border-t border-gray-100">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors">
                  <FileText size={18} /> Request DocuSign
                </button>
                <p className="text-[10px] font-medium text-center text-gray-400 mt-3">Powered by Vantage Legal Engine</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm text-[#141414]">
                <Lock size={18} />
              </div>
              <h3 className="font-display font-bold text-[#141414] text-sm">Title Deed Verification</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">Documentation for this property is locked in the Vantage Secure Vault. Agents: Upload Title Deed to initiate verification.</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/vault")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-[#141414] rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <Plus size={16} /> Upload to Vault
              </button>
              <div className="bg-white py-2.5 px-4 rounded-xl text-xs font-semibold text-center text-gray-500">
                Status: Pending Verification
              </div>
            </div>
          </div>

          <PropertyCard property={property} />
        </div>
      </div>
    </div>
  );
};