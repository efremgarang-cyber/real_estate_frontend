import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  ArrowRight, 
  Loader2, 
  Building2,
  Phone,
  Mail,
  Star,
  Shield,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Pause,
  Play,
} from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { propertyApi } from "../api/properties";
import { Property } from "../types";
import { supabase } from "../lib/supabase"; // FIX: Imported Supabase client

// Premium hero background images for the slider - High-end real estate photography
const heroImages = [
  {
    url: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=2400",
    title: "Oceanfront Villas",
    subtitle: "Uninterrupted Indian Ocean views",
  },
  {
    url: "https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?auto=compress&cs=tinysrgb&w=2400",
    title: "Modern Architectural Masterpieces",
    subtitle: "Where design meets functionality",
  },
  {
    url: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=2400",
    title: "Luxury Penthouses",
    subtitle: "Sky-high living at its finest",
  },
  {
    url: "https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg?auto=compress&cs=tinysrgb&w=2400",
    title: "Gated Estates",
    subtitle: "Privacy, security, and prestige",
  },
  {
    url: "https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=2400",
    title: "Commercial Landmarks",
    subtitle: "Prime business locations",
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFeaturedProperties = async () => {
      setLoading(true);
      try {
        const response = await propertyApi.getAllPublic();
        
        // Safely handle both wrapped and unwrap array response payloads
        const rawData = response?.data || response;
        const cleanArray = Array.isArray(rawData) ? rawData : [];

        // Safeguard status evaluation string checks against null values 
        const activeListings = cleanArray
          .filter((p: any) => (p.status?.toLowerCase() || "") === "active")
          .slice(0, 6);
          
        // FIX: Safely resolve the Supabase signed URL or public bucket URL
        const mappedListings = activeListings.map((property: any) => {
          const fallbackUrl = "https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?auto=compress&cs=tinysrgb&w=600";
          
          if (!property.images || property.images.length === 0) {
            return { ...property, _signedMainImage: fallbackUrl };
          }
          
          const firstImage = property.images[0];
          const rawUrl = firstImage.signed_url || firstImage.s3_path || firstImage.url;
          
          if (!rawUrl) {
            return { ...property, _signedMainImage: fallbackUrl };
          }

          // 1. If the backend already provided a full HTTP link, use it directly
          if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
            return { ...property, _signedMainImage: rawUrl };
          }

          // 2. Otherwise, dynamically generate the Supabase URL from the relative DB path
          const { data } = supabase.storage.from('user-files').getPublicUrl(rawUrl);
          
          return { ...property, _signedMainImage: data.publicUrl || fallbackUrl };
        });

        if (isMounted) {
          setProperties(mappedListings);
        }
      } catch (error) {
        console.error("Failed to fetch public listings safely:", error);
        if (isMounted) {
          setProperties([]); 
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    setIsAutoPlaying(false);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextSlide();
      } else {
        goToPrevSlide();
      }
    }
    setTouchStart(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/properties");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#141414]">

      {/* ─── 1. HERO — Full viewport with Premium Image Slider ──────────────────────────────────────── */}
      <section 
        className="relative h-screen w-full flex flex-col overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slider Images with Smooth Transition */}
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('${image.url}')`,
                backgroundPosition: "center 30%",
              }}
            />
            {index === currentSlide && (
              <div className="absolute inset-0 animate-slow-zoom" style={{ backgroundImage: `url('${image.url}')`, backgroundSize: "cover", backgroundPosition: "center 30%" }} />
            )}
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center z-20 pointer-events-none">
              <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-2">
                {image.subtitle}
              </p>
              <p className="text-white text-xl md:text-2xl font-light tracking-wide">
                {image.title}
              </p>
            </div>
          </div>
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-black/70 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10" />

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`cursor-pointer transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? "w-8 h-2 bg-[#D4AF37]"
                  : "w-2 h-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        <button
          onClick={goToPrevSlide}
          className="cursor-pointer absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={goToNextSlide}
          className="cursor-pointer absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm"
        >
          <ChevronRight size={20} />
        </button>

        <button
          onClick={toggleAutoPlay}
          className="cursor-pointer absolute bottom-24 right-4 md:right-8 z-30 bg-black/50 hover:bg-black/70 text-white p-2 md:p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
        >
          {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <header className="relative z-30 px-6 md:px-12 py-6 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
              <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-16 h-16 object-contain" />
            </div>
            <div className="text-white">
              <h1 className="font-display text-2xl font-bold tracking-tight leading-none">
                MAKAO
              </h1>
              <p className="text-[9px] font-bold text-[#D4AF37] tracking-[0.2em] mt-0.5 uppercase">
                Properties
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-10 text-white text-sm font-medium">
            <button onClick={() => navigate("/properties")} className="cursor-pointer relative group py-2">
              <span className="hover:text-[#D4AF37] transition-colors duration-300">Buy</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4AF37] transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => navigate("/properties")} className="cursor-pointer relative group py-2">
              <span className="hover:text-[#D4AF37] transition-colors duration-300">Rent</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4AF37] transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button onClick={() => navigate("/properties")} className="cursor-pointer relative group py-2">
              <span className="hover:text-[#D4AF37] transition-colors duration-300">Developments</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#D4AF37] transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button
              onClick={() => navigate("/auth/login")}
              className="cursor-pointer bg-[#D4AF37] text-[#141414] px-7 py-2.5 font-bold uppercase tracking-wider text-xs hover:bg-white transition-all duration-300 hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </nav>
        </header>

        <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 md:px-12 text-center">
          <div className="animate-fade-up">
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-6">
              Kenya's Premier Property Platform
            </p>
            <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-[1.05] mb-6 max-w-5xl">
              Find Your <br className="hidden md:block" />
              Next <span className="text-[#D4AF37]">Asset</span>
            </h2>
            <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed">
              Exclusive access to Kenya's most sought-after verified real estate:
              residential, commercial, and land.
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="bg-white/95 backdrop-blur-sm flex flex-col sm:flex-row w-full max-w-3xl mx-auto shadow-2xl rounded-lg overflow-hidden"
          >
            <div className="flex-1 flex items-center px-6 py-4 sm:py-0 border-b sm:border-b-0 sm:border-r border-gray-200/50">
              <MapPin size={20} className="text-[#D4AF37] shrink-0" />
              <input
                type="text"
                placeholder="Search location, city, or property ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-[#141414] placeholder:text-gray-400 px-4 py-3.5 font-medium outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              className="cursor-pointer bg-[#141414] text-[#D4AF37] px-12 py-4.5 font-bold uppercase tracking-wider text-sm hover:bg-[#222] transition-all duration-300 whitespace-nowrap flex items-center gap-2 justify-center group"
            >
              Search <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <div className="relative z-20 flex justify-center pb-10 animate-bounce">
          <div className="w-px h-12 bg-gradient-to-b from-[#D4AF37]/0 to-[#D4AF37]/60" />
        </div>
      </section>

      {/* ─── 2. FEATURED PROPERTIES with Premium Card Design ──────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-28 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
              Curated Selection
            </p>
            <h3 className="font-display text-3xl md:text-5xl font-bold text-[#141414]">
              Featured Properties
            </h3>
            <div className="w-20 h-0.5 bg-[#D4AF37] mt-5" />
          </div>
          <button
            onClick={() => navigate("/properties")}
            className="cursor-pointer flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#141414] hover:text-[#D4AF37] transition-all duration-300 group"
          >
            View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="relative">
              <Loader2 size={40} className="animate-spin text-[#D4AF37]" />
              <div className="absolute inset-0 animate-ping rounded-full bg-[#D4AF37]/20 w-10 h-10 -m-1"></div>
            </div>
            <p className="text-sm font-medium text-gray-400">
              Loading exclusive listings...
            </p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-32 bg-gray-50/50 border border-gray-200 rounded-2xl">
            <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-base font-medium text-gray-500">
              No active properties at this moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property, index) => {
            const mainImage = (property as any)._signedMainImage;
            
            return (
              <div
                key={property.id}
                onClick={() => navigate(`/properties/${property.id}`)}
                className="cursor-pointer group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-[#D4AF37] hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                  {/* Flat Minimalist Label indicator - No borders or glowy attributes */}
                  <div className="absolute top-4 left-4 bg-[#141414] text-[#D4AF37] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest z-10 rounded">
                    Featured
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 z-10" />
                  <img
                    src={mainImage}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-2xl font-bold text-[#141414]">
                        {formatCurrency(Number(property.price))}
                      </p>
                      {/* Clean, simple text styling applied here - no badge layouts */}
                      <div className="flex items-center gap-1 text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">
                        <Star size={12} fill="#D4AF37" />
                        <span>Premium</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-base text-gray-800 line-clamp-1">
                      {property.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-2 truncate flex items-center gap-1">
                      <MapPin size={12} className="text-[#D4AF37] shrink-0" />
                      {property.location || "Location Unspecified"}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 mt-6 pt-5 border-t border-gray-100 text-sm font-bold text-[#141414]">
                    <div className="flex items-center gap-2">
                      <Bed size={16} className="text-[#D4AF37]" />
                      <span>{property.bedrooms ?? "-"} Beds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath size={16} className="text-[#D4AF37]" />
                      {/* Bound explicitly to server 'baths' property to match schema fallback values */}
                      <span>{property.baths ?? "-"} Baths</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Maximize2 size={16} className="text-[#D4AF37]" />
                      <span>{property.sqft ? property.sqft.toLocaleString() : "-"} sqft</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </section>

      {/* ─── 3. STATISTICS / TRUST INDICATORS ───────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#0A0A0A] to-[#141414] text-white py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-3 transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto">
                <Shield size={32} className="text-[#D4AF37]" />
              </div>
              <p className="text-4xl font-bold text-[#D4AF37]">100%</p>
              <p className="text-sm uppercase tracking-wider font-semibold text-gray-400">Verified Properties</p>
            </div>
            <div className="space-y-3 transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp size={32} className="text-[#D4AF37]" />
              </div>
              <p className="text-4xl font-bold text-[#D4AF37]">2,500+</p>
              <p className="text-sm uppercase tracking-wider font-semibold text-gray-400">Successful Transactions</p>
            </div>
            <div className="space-y-3 transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-[#D4AF37]" />
              </div>
              <p className="text-4xl font-bold text-[#D4AF37]">98%</p>
              <p className="text-sm uppercase tracking-wider font-semibold text-gray-400">Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. WHY CHOOSE US with Premium Visuals ───────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] mb-3">
              Why Makao
            </p>
            <h3 className="font-display text-3xl md:text-4xl font-bold text-[#141414]">
              The Smart Choice for Real Estate
            </h3>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up">
              <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield size={32} className="text-[#D4AF37]" />
              </div>
              <h4 className="text-xl font-bold mb-3">Secure Transactions</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Bank-grade encryption and secure escrow for all property transactions.
              </p>
            </div>
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-[#D4AF37]" />
              </div>
              <h4 className="text-xl font-bold mb-3">Verified Listings</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every property is manually verified for authenticity and accuracy.
              </p>
            </div>
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp size={32} className="text-[#D4AF37]" />
              </div>
              <h4 className="text-xl font-bold mb-3">Market Expertise</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Deep local knowledge and data-driven insights for smart investments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. CTA / AGENCY BLOCK with Premium Design ───────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#141414] to-[#1a1a1a] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2">
          <div className="p-12 md:p-16 flex flex-col justify-center relative z-10">
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] mb-4">
              List With Us
            </p>
            <h3 className="font-display text-3xl md:text-4xl font-bold mb-6 leading-tight">
              List Your Property <br />
              With Makao
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-md">
              Tap into our exclusive network of verified buyers and professional
              agents. Secure document handling, rapid escrow processing, and
              maximum market exposure.
            </p>
            <div className="space-y-4 text-sm font-medium text-gray-300">
              <div className="flex items-center gap-4 group cursor-pointer hover:text-[#D4AF37] transition-colors">
                <Phone size={18} className="text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span>+254 (0) 700 000 000</span>
              </div>
              <div className="flex items-center gap-4 group cursor-pointer hover:text-[#D4AF37] transition-colors">
                <Mail size={18} className="text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span>acquisitions@makao.co.ke</span>
              </div>
            </div>
            <button className="cursor-pointer mt-12 w-fit bg-[#D4AF37] text-[#141414] px-10 py-4 font-bold uppercase tracking-wider text-sm hover:bg-white transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-0.5 rounded">
              Request Assessment
            </button>
          </div>
          <div
            className="hidden md:block bg-cover bg-center min-h-[500px] relative"
            style={{
              backgroundImage:
                "url('https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=1200')",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* ─── 6. FOOTER with Enhanced Design ───────────────────────────────────────────────────── */}
      <footer className="bg-[#0A0A0A] border-t border-[#1a1a1a] py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-6 group cursor-pointer">
              <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-14 h-14 object-contain transition-transform group-hover:scale-105" />
              <div>
                <h1 className="font-display text-xl font-bold text-white tracking-tight">
                  MAKAO
                </h1>
                <p className="text-[8px] font-bold text-[#D4AF37] tracking-[0.2em] uppercase">
                  Properties
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              The premier ecosystem for secure, transparent, and agent-driven
              real estate transactions in East Africa.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-xs">
            <div className="flex flex-col gap-3 text-gray-400">
              <span className="font-bold text-white uppercase tracking-widest mb-3 text-[10px]">
                Explore
              </span>
              {["Residential Sales", "Commercial Leasing", "New Developments", "Land Plots"].map((l) => (
                <span key={l} className="cursor-pointer hover:text-[#D4AF37] transition-colors duration-300">
                  {l}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 text-gray-400">
              <span className="font-bold text-white uppercase tracking-widest mb-3 text-[10px]">
                Resources
              </span>
              {["Buyer's Guide", "Seller's Guide", "Market Reports", "FAQs"].map((l) => (
                <span key={l} className="cursor-pointer hover:text-[#D4AF37] transition-colors duration-300">
                  {l}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 text-gray-400">
              <span className="font-bold text-white uppercase tracking-widest mb-3 text-[10px]">
                System
              </span>
              <span
                className="cursor-pointer hover:text-[#D4AF37] transition-colors duration-300"
                onClick={() => navigate("/auth/login")}
              >
                Get Started
              </span>
              <span className="cursor-pointer hover:text-[#D4AF37] transition-colors duration-300">
                KYC Verification
              </span>
              <span className="cursor-pointer hover:text-[#D4AF37] transition-colors duration-300">
                Legal Framework
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[#1a1a1a] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest text-gray-600 font-bold">
          <p>© {new Date().getFullYear()} Makao Systems Core. All rights reserved.</p>
          <div className="flex gap-8">
            <span className="cursor-pointer hover:text-[#D4AF37] transition-colors duration-300">
              Privacy Policy
            </span>
            <span className="cursor-pointer hover:text-[#D4AF37] transition-colors duration-300">
              Terms of Service
            </span>
            <span className="cursor-pointer hover:text-[#D4AF37] transition-colors duration-300">
              Cookie Policy
            </span>
          </div>
        </div>
      </footer>

      {/* Custom Keyframes */}
      <style>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-out infinite alternate;
        }
        .animate-fade-up {
          animation: fade-up 0.8s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;