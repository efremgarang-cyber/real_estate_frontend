import React from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  MapPin, 
  LayoutGrid, 
  List, 
  Search,
  Bed,
  Bath,
  Maximize2,
  Calendar
} from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";

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
    expires: "2024-12-01",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800"
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
    expires: "2024-08-15",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800"
  },
  { 
    id: "3", 
    title: "Hilltop Meadows", 
    price: 12000000, 
    location: "Naivasha, Kenya", 
    status: "Active",
    beds: 0, 
    baths: 0, 
    sqft: 43560, // 1 acre
    expires: "2025-01-10",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800"
  }
];

export const PropertiesPage: React.FC = () => {
  const [view, setView] = React.useState<"grid" | "list">("grid");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search listings..." 
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[#141414] bg-white p-1 mr-2">
            <button 
              onClick={() => setView("grid")}
              className={cn("p-1.5 transition-colors", view === "grid" ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-gray-100")}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setView("list")}
              className={cn("p-1.5 transition-colors", view === "list" ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-gray-100")}
            >
              <List size={16} />
            </button>
          </div>
          <button className="btn-primary flex items-center gap-2 text-xs">
            <Plus size={14} /> New Listing
          </button>
        </div>
      </div>

      <div className={cn(
        "grid gap-8",
        view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {properties.map((property) => (
          <Link 
            key={property.id} 
            to={`/properties/${property.id}`}
            className={cn(
              "dashboard-card group flex flex-col transition-all hover:translate-y-[-4px]",
              view === "list" && "md:flex-row md:items-center md:gap-8"
            )}
          >
            <div className={cn(
              "relative aspect-video bg-gray-200 overflow-hidden border border-[#141414]",
              view === "list" ? "md:w-64 md:aspect-square md:shrink-0" : "w-full mb-4"
            )}>
              <img 
                src={property.image}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                alt={property.title}
              />
              <div className={cn(
                "absolute top-2 right-2 text-[10px] px-2 py-1 font-mono uppercase italic border border-[#141414]",
                property.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {property.status}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="mb-4">
                <h4 className="text-xl font-black uppercase leading-tight mb-1 group-hover:underline underline-offset-4 decoration-2">
                  {property.title}
                </h4>
                <p className="text-xs font-mono text-gray-500 uppercase flex items-center gap-1 italic">
                  <MapPin size={10} /> {property.location}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-gray-400 uppercase italic">Beds</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Bed size={14} /> {property.beds === 0 ? "-" : property.beds}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-gray-400 uppercase italic">Baths</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Bath size={14} /> {property.baths === 0 ? "-" : property.baths}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-gray-400 uppercase italic">Area</span>
                  <div className="flex items-center gap-1.5 font-bold whitespace-nowrap">
                    <Maximize2 size={14} /> {property.sqft.toLocaleString()} <span className="text-[10px]">SQFT</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-mono text-gray-400 uppercase italic">Listing Price</p>
                  <p className="text-2xl font-black">{formatCurrency(property.price)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 uppercase italic">
                  <Calendar size={12} /> Expires {property.expires}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
