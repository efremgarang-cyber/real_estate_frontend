import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  ArrowRight, 
  Loader2, 
  Building2,
  Phone,
  Mail,
} from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { propertyApi } from "../api/properties";
import { Property } from "../types";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      setLoading(true);
      try {
        const response = await propertyApi.getAll();
        const data = response.data || [];
        setProperties(
          data
            .filter((p: Property) => p.status?.toLowerCase() === "active")
            .slice(0, 6)
        );
      } catch (error) {
        console.error("Failed to fetch public listings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProperties();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/client/marketplace?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/client/marketplace");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#141414]">

      {/* ─── 1. HERO — full viewport ──────────────────────────────────────── */}
      <section className="relative h-screen w-full flex flex-col">

        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2400&auto=format&fit=crop')",
          }}
        />
        {/* Multi-stop overlay: dark top for nav legibility, clears mid, dark bottom for text */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-black/80" />

        {/* ── Navbar (floats inside hero) ── */}
        <header className="relative z-50 px-6 md:px-12 py-6 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-14 h-14 object-contain" />
            </div>
            <div className="text-white">
              <h1 className="font-display text-2xl font-bold tracking-tight leading-none">
                MAKAO
              </h1>
              <p className="text-[9px] font-bold text-[#D4AF37] tracking-widest mt-0.5 uppercase">
                Properties
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-white text-sm font-medium">
            <button
              onClick={() => navigate("/client/marketplace")}
              className="hover:text-[#D4AF37] transition-colors"
            >
              Buy
            </button>
            <button
              onClick={() => navigate("/client/marketplace")}
              className="hover:text-[#D4AF37] transition-colors"
            >
              Rent
            </button>
            <button
              onClick={() => navigate("/client/marketplace")}
              className="hover:text-[#D4AF37] transition-colors"
            >
              Developments
            </button>
            <button
              onClick={() => navigate("/agent/dashboard")}
              className="bg-[#D4AF37] text-[#141414] px-6 py-2.5 font-bold uppercase tracking-wider text-xs hover:bg-white transition-colors"
            >
              Agent Portal
            </button>
          </nav>
        </header>

        {/* ── Hero copy + search (vertically centered in remaining space) ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-12 text-center">
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-5">
            Kenya's Premier Property Platform
          </p>
          <h2 className="font-display text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6 max-w-4xl">
            Find Your <br className="hidden md:block" />
            Next Asset
          </h2>
          <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Exclusive access to Kenya's most sought-after verified real estate:
            residential, commercial, and land.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white flex flex-col sm:flex-row w-full max-w-3xl mx-auto shadow-2xl"
          >
            <div className="flex-1 flex items-center px-5 py-4 sm:py-0 border-b sm:border-b-0 sm:border-r border-gray-200">
              <MapPin size={18} className="text-[#D4AF37] shrink-0" />
              <input
                type="text"
                placeholder="Search location, city, or property ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-[#141414] placeholder:text-gray-400 px-4 py-3 font-medium outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-[#141414] text-[#D4AF37] px-10 py-4 font-bold uppercase tracking-wider text-xs hover:bg-[#222] transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </form>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8 animate-bounce">
          <div className="w-px h-10 bg-gradient-to-b from-white/0 to-white/40" />
        </div>
      </section>

      {/* ─── 2. FEATURED PROPERTIES ──────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-24 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
              Curated Selection
            </p>
            <h3 className="font-display text-3xl md:text-4xl font-bold text-[#141414]">
              Featured Properties
            </h3>
            <div className="w-16 h-0.5 bg-[#D4AF37] mt-4" />
          </div>
          <button
            onClick={() => navigate("/client/marketplace")}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#141414] hover:text-[#D4AF37] transition-colors"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 size={28} className="animate-spin text-[#D4AF37]" />
            <p className="text-sm font-medium text-gray-400">
              Loading exclusive listings...
            </p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 border border-gray-100">
            <Building2 size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">
              No active properties at this moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => {
              const firstImage = property.images?.[0];
              const mainImage =
                typeof firstImage === "string"
                  ? firstImage
                  : (firstImage as any)?.s3_path ||
                    (firstImage as any)?.url ||
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600";

              return (
                <div
                  key={property.id}
                  onClick={() => navigate(`/client/marketplace/${property.id}`)}
                  className="group cursor-pointer flex flex-col bg-white border border-gray-100 hover:border-[#D4AF37] hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                    <div className="absolute top-4 left-4 bg-[#141414] text-[#D4AF37] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest z-10">
                      Active
                    </div>
                    <img
                      src={mainImage}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xl font-bold text-[#141414] mb-2">
                        {formatCurrency(Number(property.price))}
                      </p>
                      <h4 className="font-bold text-sm text-gray-700 line-clamp-1">
                        {property.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 truncate flex items-center gap-1">
                        <MapPin size={11} className="text-[#D4AF37]" />
                        {property.location || "Location Unspecified"}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100 text-xs font-bold text-[#141414]">
                      <div className="flex items-center gap-1.5">
                        <Bed size={14} className="text-[#D4AF37]" />
                        {property.bedrooms ?? "-"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath size={14} className="text-[#D4AF37]" />
                        {property.baths ?? "-"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Maximize2 size={14} className="text-[#D4AF37]" />
                        {property.sqft ? property.sqft.toLocaleString() : "-"} sqft
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── 3. CTA / AGENCY BLOCK ───────────────────────────────────────── */}
      <section className="bg-[#141414] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2">
          <div className="p-12 md:p-24 flex flex-col justify-center">
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] mb-4">
              List With Us
            </p>
            <h3 className="font-display text-3xl md:text-4xl font-bold mb-6 leading-tight">
              List Your Property With Makao
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-md">
              Tap into our exclusive network of verified buyers and professional
              agents. Secure document handling, rapid escrow processing, and
              maximum market exposure.
            </p>
            <div className="space-y-4 text-sm font-medium text-gray-300">
              <div className="flex items-center gap-4">
                <Phone size={16} className="text-[#D4AF37]" />
                +254 (0) 700 000 000
              </div>
              <div className="flex items-center gap-4">
                <Mail size={16} className="text-[#D4AF37]" />
                acquisitions@makao.co.ke
              </div>
            </div>
            <button className="mt-12 w-fit bg-[#D4AF37] text-[#141414] px-8 py-4 font-bold uppercase tracking-wider text-xs hover:bg-white transition-colors">
              Request Assessment
            </button>
          </div>
          <div
            className="hidden md:block bg-cover bg-center min-h-[500px]"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop')",
            }}
          />
        </div>
      </section>

      {/* ─── 4. FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-[#0A0A0A] border-t border-[#1a1a1a] py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-14 h-14 object-contain" />
              <h1 className="font-display text-xl font-bold text-white tracking-tight">
                MAKAO
              </h1>
            </div>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              The premier ecosystem for secure, transparent, and agent-driven
              real estate transactions in East Africa.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 text-xs">
            <div className="flex flex-col gap-3 text-gray-400">
              <span className="font-bold text-white uppercase tracking-widest mb-2 text-[10px]">
                Explore
              </span>
              {["Residential Sales", "Commercial Leasing", "New Developments"].map((l) => (
                <span key={l} className="cursor-pointer hover:text-[#D4AF37] transition-colors">
                  {l}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 text-gray-400">
              <span className="font-bold text-white uppercase tracking-widest mb-2 text-[10px]">
                System
              </span>
              <span
                className="cursor-pointer hover:text-[#D4AF37] transition-colors"
                onClick={() => navigate("/agent/dashboard")}
              >
                Agent Portal
              </span>
              <span className="cursor-pointer hover:text-[#D4AF37] transition-colors">
                KYC Verification
              </span>
              <span className="cursor-pointer hover:text-[#D4AF37] transition-colors">
                Legal Framework
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[#1a1a1a] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-gray-600 font-bold">
          <p>© {new Date().getFullYear()} Makao Systems Core.</p>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-white transition-colors">
              Privacy Policy
            </span>
            <span className="cursor-pointer hover:text-white transition-colors">
              Terms of Service
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;