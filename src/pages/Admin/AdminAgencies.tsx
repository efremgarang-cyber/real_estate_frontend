import React, { useState, useEffect } from "react";
import { 
  Search, 
  Briefcase, 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  CheckCircle,
  Clock
} from "lucide-react";
import { api } from "../../lib/api";
import { useNavigate } from "react-router-dom";

export const AdminAgencies: React.FC = () => {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAgencies = async () => {
    try {
      const response = await api.get("/admin/agencies");
      setAgencies(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Failed to fetch platform agencies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const filteredAgencies = agencies.filter((agency) =>
    agency.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.company_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agency.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white mx-auto"></div>
          <p className="mt-4 text-xs font-medium text-neutral-400 tracking-wide">Loading agency records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans antialiased text-neutral-900 dark:text-neutral-100">
      
      {/* ── HEADER ACTION LAYER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <button 
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-3 group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> 
            Back to Hub
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Corporate Agencies</h1>
          <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mt-1">
            Manage corporate workspaces and platform compliance parameters.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Filter agencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Agencies</span>
            <Building2 size={16} className="text-neutral-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{agencies.length}</p>
        </div>
        <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {agencies.filter(a => a.is_active || a.verified_at).length}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Pending Review</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {agencies.filter(a => !a.is_active && !a.verified_at).length}
          </p>
        </div>
      </div>

      {/* ── AGENCY GRID ── */}
      {filteredAgencies.length === 0 ? (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/60 py-16 text-center shadow-sm">
          <Briefcase size={40} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-700 opacity-60" />
          <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-1">No agencies found</h3>
          <p className="text-xs text-neutral-400">
            {searchTerm ? "Try adjusting your search criteria or query filters." : "Agencies will appear here once registered."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAgencies.map((agency) => (
            <div
              key={agency.id}
              className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/60 p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-xl flex items-center justify-center text-neutral-700 dark:text-neutral-300 font-bold text-sm flex-shrink-0">
                    {agency.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate text-neutral-900 dark:text-neutral-100">{agency.name || "Unnamed Agency"}</h3>
                    <p className="text-[11px] text-neutral-400 font-medium tracking-tight mt-0.5">ID: #{agency.id}</p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  agency.verified_at || agency.is_active
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-900/30'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/30 dark:border-amber-900/30'
                }`}>
                  {agency.verified_at || agency.is_active ? (
                    <><ShieldCheck size={10} /> Verified</>
                  ) : (
                    <><AlertCircle size={10} /> Pending</>
                  )}
                </span>
              </div>

              {/* Details List */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                  <Mail size={13} className="text-neutral-400 flex-shrink-0" />
                  <span className="truncate">{agency.company_email || agency.email || "No email provided"}</span>
                </div>
                
                <div className="flex items-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                  <Phone size={13} className="text-neutral-400 flex-shrink-0" />
                  <span>{agency.phone || "No phone record"}</span>
                </div>
                
                {agency.created_at && (
                  <div className="flex items-center gap-2.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <Calendar size={13} className="text-neutral-400 flex-shrink-0" />
                    <span>Registered {new Date(agency.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};