import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  MapPin, 
  LayoutGrid, 
  List, 
  Search,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Loader2,
  Users,
  Download,
  Building,
  ShieldCheck
} from "lucide-react";
import { formatCurrency, cn } from "../../../lib/utils";
import { propertyApi } from "../../../api/properties"; 
import { vaultApi } from "../../../api/vault";

const KENYAN_PROPERTY_IMAGE_MAP: Record<string, string> = {
  kitisuru: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop",
  muthaiga: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
  milimani: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
  karen: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
  kilimani: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop"
};

export const AdminPropertiesPage: React.FC = () => {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [properties, setProperties] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("all");
  const [triggerRefresh, setTriggerRefresh] = useState(0);

  // Mock workspace team matrix for administration scopes
  const [agentsList] = useState([
    { id: "all", name: "All Workspace Agents" },
    { id: "usr_1", name: "Alex Mwangi" },
    { id: "usr_2", name: "Sarah Kiprop" }
  ]);

  useEffect(() => {
    const fetchAgencyMasterPortfolio = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetches global tenant records rather than individual agent assignments
        const response = await propertyApi.getAll(1);
        const items = response.data || []; 

        const processedItems = await Promise.all(
          (Array.isArray(items) ? items : []).map(async (property: any) => {
            let rawUrl: string | null = null;
            if (property?.images && Array.isArray(property.images) && property.images.length > 0) {
              const primaryImage = property.images[0];
              if (typeof primaryImage === "string") rawUrl = primaryImage;
              else if (typeof primaryImage === "object" && primaryImage !== null) {
                rawUrl = primaryImage.s3_path || primaryImage.url || primaryImage.file_path;
              }
            }

            let finalUrl = "";
            if (rawUrl) {
              finalUrl = await vaultApi.getSignedUrl(rawUrl);
            } else {
              const searchString = `${property?.title || ""} ${property?.location || ""} ${property?.neighborhood || ""}`.toLowerCase();
              if (searchString.includes("kitisuru")) finalUrl = KENYAN_PROPERTY_IMAGE_MAP.kitisuru;
              else if (searchString.includes("muthaiga") || searchString.includes("oribi")) finalUrl = KENYAN_PROPERTY_IMAGE_MAP.muthaiga;
              else if (searchString.includes("milimani")) finalUrl = KENYAN_PROPERTY_IMAGE_MAP.milimani;
              else if (searchString.includes("karen")) finalUrl = KENYAN_PROPERTY_IMAGE_MAP.karen;
              else if (searchString.includes("kilimani")) finalUrl = KENYAN_PROPERTY_IMAGE_MAP.kilimani;
              else finalUrl = KENYAN_PROPERTY_IMAGE_MAP.default;
            }

            // Injecting mock agent relationships for demonstration
            const assignedAgent = property.agent_id === "usr_2" ? agentsList[2] : agentsList[1];

            return { 
              ...property, 
              _signedMainImage: finalUrl,
              _assignedAgent: assignedAgent
            };
          })
        );

        setProperties(processedItems);
      } catch (err) {
        console.error("Global portfolio read fault:", err);
        setError("Unable to process the agency's master inventory data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgencyMasterPortfolio();
  }, [triggerRefresh]);

  // Two-tiered filtering logic: checks both search terms and cross-team owner queries
  const filteredProperties = useMemo(() => {
    let result = properties;
    
    if (selectedAgentId !== "all") {
      result = result.filter(p => p.agent_id === selectedAgentId || p._assignedAgent?.id === selectedAgentId);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => 
        p.title?.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query) ||
        p.neighborhood?.toLowerCase().includes(query) ||
        p._assignedAgent?.name?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [searchQuery, selectedAgentId, properties]);

  // Aggregate Portfolio Calculations
  const metrics = useMemo(() => {
    const totalValue = filteredProperties.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
    const activeCount = filteredProperties.filter(p => p.status === "active" || p.status === "Active").length;
    return { totalValue, activeCount };
  }, [filteredProperties]);

  const handleExportInventoryCSV = () => {
    // Systematic client-side string transformation for data transparency audits
    const headers = ["ID", "Title", "Location", "Price", "Assigned Agent", "Status", "Expiration"];
    const rows = filteredProperties.map(p => [
      p.id, 
      `"${p.title || ''}"`, 
      `"${p.location || ''}"`, 
      p.price || 0, 
      `"${p._assignedAgent?.name || 'Unassigned'}"`, 
      p.status || 'Active', 
      p.contract_end_date || 'Not Set'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Makao_Agency_Inventory_Report_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* Admin Module Header block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-[#141414]" />
            <h1 className="text-xl font-bold text-[#141414] tracking-tight">Agency Inventory Ledger</h1>
          </div>
          <p className="text-xs text-gray-500">Global oversight of multi-tenancy assets and individual agent listings.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={handleExportInventoryCSV}
            disabled={filteredProperties.length === 0}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 border border-gray-200 rounded-xl font-medium transition-colors text-xs shadow-sm disabled:opacity-50"
          >
            <Download size={14} /> Export Sheet
          </button>
        </div>
      </div>

      {/* Analytical Overview Banner Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/60 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-gray-700 border border-neutral-100 shrink-0">
            <Building size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gross Portfolio Value</p>
            <h3 className="text-lg font-black text-[#141414] tracking-tight mt-0.5">{formatCurrency(metrics.totalValue)}</h3>
          </div>
        </div>
        <div className="bg-white border border-gray-200/60 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50/50 flex items-center justify-center text-green-600 border border-green-100 shrink-0">
            <LayoutGrid size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monitored Assets</p>
            <h3 className="text-lg font-black text-[#141414] tracking-tight mt-0.5">{filteredProperties.length} Listings</h3>
          </div>
        </div>
        <div className="bg-white border border-gray-200/60 p-5 rounded-[2rem] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50/50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live View Mode</p>
            <h3 className="text-lg font-black text-[#141414] tracking-tight mt-0.5">
              {selectedAgentId === "all" ? "Whole Team" : "Single Agent Slice"}
            </h3>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-1 gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword or representative name..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] text-xs font-medium text-[#141414] shadow-sm"
            />
          </div>

          <div className="relative shrink-0">
            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="pl-9 pr-8 h-full bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-sm appearance-none cursor-pointer"
            >
              {agentsList.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 self-end md:self-auto">
          <button title="Grid view" onClick={() => setView("grid")} className={cn("p-2 rounded-lg transition-colors", view === "grid" ? "bg-gray-100 text-[#141414]" : "text-gray-400")}>
            <LayoutGrid size={16} />
          </button>
          <button title="List view" onClick={() => setView("list")} className={cn("p-2 rounded-lg transition-colors", view === "list" ? "bg-gray-100 text-[#141414]" : "text-gray-400")}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Loading Engine Framework */}
      {isLoading && (
        <div className="min-h-[30vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 size={24} className="animate-spin text-[#141414]" />
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">Syncing Master Ledger...</p>
        </div>
      )}

      {/* Empty State Deck */}
      {!isLoading && filteredProperties.length === 0 && (
        <div className="min-h-[30vh] flex flex-col items-center justify-center bg-white border border-gray-200/60 rounded-[2rem] p-8 text-center">
          <p className="text-sm font-medium text-gray-400">No company assets fall under these active structural boundaries.</p>
        </div>
      )}

      {/* Asset Grid Layout System */}
      {!isLoading && filteredProperties.length > 0 && (
        <div className={cn("grid gap-6", view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
          {filteredProperties.map((property) => {
            const resolvedImage = property._signedMainImage || KENYAN_PROPERTY_IMAGE_MAP.default;
            const isListed = property.status === "active" || property.status === "Active";

            return (
              <Link 
                key={property.id} 
                to={`/admin/properties/${property.id}`} // Routes to the higher clearance admin edit deck
                className={cn(
                  "bg-white rounded-[2rem] border border-gray-200/50 p-5 flex flex-col hover:shadow-xl hover:border-gray-200 transition-all group",
                  view === "list" && "md:flex-row md:items-center md:gap-8"
                )}
              >
                <div className={cn("relative bg-gray-50 overflow-hidden rounded-2xl shrink-0", view === "list" ? "md:w-48 md:aspect-square" : "w-full aspect-[4/3] mb-5")}>
                  <img src={resolvedImage} className="w-full h-full object-cover" alt="Portfolio asset tracking frame" loading="lazy" />
                  
                  {/* Floating Agent Ownership Tag inside Admin scope */}
                  <div className="absolute top-3 left-3 bg-[#141414]/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-sm">
                    <Users size={10} className="text-neutral-300" />
                    {property._assignedAgent?.name || "Unassigned"}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between h-full w-full">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="font-display text-sm font-bold text-[#141414] leading-snug group-hover:text-blue-900 transition-colors line-clamp-1">
                        {property.title}
                      </h4>
                      <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0", isListed ? "text-green-600 bg-green-50 border-green-100" : "text-gray-400 bg-gray-50 border-gray-200")}>
                        {property.status || "Active"}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mb-4">
                      <MapPin size={10} /> {property.location || "Nairobi, Kenya"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100 mb-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Beds</span>
                      <span className="text-xs font-bold text-[#141414] mt-0.5">{property.bedrooms || property.beds || "-"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Baths</span>
                      <span className="text-xs font-bold text-[#141414] mt-0.5">{property.baths || property.bathrooms || "-"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Area</span>
                      <span className="text-xs font-bold text-[#141414] mt-0.5 truncate">{property.sqft ? `${property.sqft.toLocaleString()} SF` : "-"}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Market Value</p>
                      <p className="text-base font-black text-[#141414] tracking-tight">{formatCurrency(property.price || 0)}</p>
                    </div>
                    <div className="text-[9px] font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Calendar size={10} /> Exp: {property.contract_end_date || "Open"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};