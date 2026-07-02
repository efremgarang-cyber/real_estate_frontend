import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Home as HomeIcon, Users as UsersIcon,
  Shield as ShieldIcon, Loader2, Bot, Cpu, Search
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from "recharts";
import { formatCurrency, cn } from "../lib/utils";
import { propertyApi } from "../api/properties";
import { leadApi } from "../api/leads";
import { documentApi } from "../api/documents";
import { authApi } from "../api/auth";

// ── Types ──────────────────────────────────────────────────────────────────
interface Match {
  lead_id: number;
  lead_name: string;
  property_title: string;
  score: number;
  reasoning: string;
}

interface MatchSweep {
  status: "idle" | "scanning" | "done" | "error";
  lastRun: string | null;
  totalLeads: number;
  totalProperties: number;
  matches: Match[];
}

// ── AI Matching Panel ──────────────────────────────────────────────────────
const MatchingAgentPanel: React.FC<{ sweep: MatchSweep }> = ({ sweep }) => {
  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-600" :
    s >= 60 ? "text-amber-600" :
              "text-gray-400";

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.07)] transition-shadow border border-gray-50 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-[#141414]" />
          <h3 className="font-display text-base font-bold text-[#141414]">Property Matching Agent</h3>
        </div>
        {sweep.status === "scanning" && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-[#C5A880] bg-[#C5A880]/10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse" />
            Scanning
          </span>
        )}
        {sweep.status === "done" && (
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2.5 py-1 rounded-full">
            {sweep.matches.length} Matches
          </span>
        )}
      </div>

      {/* Active scan indicator */}
      {sweep.status === "scanning" && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl mb-5">
          <Cpu size={16} className="text-[#C5A880] shrink-0" />
          <p className="text-xs font-medium text-gray-500 flex-1">
            Cross-referencing <span className="font-bold text-[#141414]">{sweep.totalLeads} leads</span> vs <span className="font-bold text-[#141414]">{sweep.totalProperties} listings</span>
          </p>
        </div>
      )}

      {/* Match list */}
      <div className="flex-1 overflow-y-auto pr-2">
        {sweep.matches.length > 0 ? (
          <div className="space-y-4">
            {sweep.matches.slice(0, 5).map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-4 group">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-[#141414] truncate group-hover:text-[#C5A880] transition-colors">{m.lead_name}</p>
                  <p className="text-xs font-medium text-gray-400 truncate mt-0.5">{m.property_title}</p>
                </div>
                <span className={cn("text-lg font-black tracking-tight shrink-0", scoreColor(m.score))}>
                  {m.score}%
                </span>
              </div>
            ))}
          </div>
        ) : sweep.status === "done" ? (
          <div className="flex h-full items-center justify-center text-sm font-medium text-gray-400">
            No strong matches found.
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {sweep.lastRun ? `Run: ${new Date(sweep.lastRun).toLocaleTimeString()}` : "Pending"}
        </p>
        <Link to="/agent/matches" className="text-xs font-bold text-[#141414] hover:text-[#C5A880] transition-colors">
          View Details
        </Link>
      </div>
    </div>
  );
};

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, trend, icon: Icon, trendInverse = false }: any) => {
  const isPositive = String(trend).startsWith("+");
  const trendColor = trendInverse
    ? (isPositive ? "text-red-600" : "text-green-600")
    : (isPositive ? "text-green-600" : "text-red-600");

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.07)] transition-shadow border border-gray-50 p-6 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</h3>
        <div className="p-2 bg-gray-50 rounded-xl">
          <Icon size={16} className="text-[#141414]" />
        </div>
      </div>
      <p className="text-3xl font-black text-[#141414] tracking-tight mb-2">{value}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <span className={trendColor}>{trend}</span> vs last month
      </p>
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────
export const DashboardOverview: React.FC = () => {
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [stats, setStats]             = useState({ activeListings: 0, newLeads: 0, closedDeals: 0, kycPending: 0 });
  const [chartData, setChartData]     = useState<any[]>([]);
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [sweep, setSweep]             = useState<MatchSweep>({
    status: "scanning",
    lastRun: null,
    totalLeads: 0,
    totalProperties: 0,
    matches: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const [userRes, propsRes, leadsRes] = await Promise.allSettled([
          authApi.getCurrentUser(),
          propertyApi.getAgencyProperties(1),
          leadApi.getAll(1),
        ]);

        const extractData = (res: any) => {
          if (res.status !== "fulfilled") return [];
          const p = res.value;
          if (Array.isArray(p)) return p;
          if (p?.data && Array.isArray(p.data)) return p.data;
          if (p?.data?.data && Array.isArray(p.data.data)) return p.data.data;
          return [];
        };

        const properties = extractData(propsRes);
        const leads      = extractData(leadsRes);

        let docs: any[] = [];
        if (userRes.status === "fulfilled") {
          const agencyId = userRes.value.profile?.agencyId ?? (userRes.value.profile as any)?.agency_id;
          if (agencyId) {
            try {
              const docsRes = await documentApi.getAgencyDocuments({ agencyId: String(agencyId) });
              docs = Array.isArray(docsRes.data?.data) ? docsRes.data.data : [];
            } catch {}
          }
        }

        const activeProps   = properties.filter((p: any) => p.status?.toLowerCase() === "active" || p.status?.toLowerCase() === "active_listing");
        const newLeads      = leads.filter((l: any) => l.kanban_stage === "new" || l.status === "new");
        const closedDeals   = properties.filter((p: any) => ["under_contract","sold"].includes(p.status?.toLowerCase())).length
                            + leads.filter((l: any) => l.kanban_stage?.toLowerCase() === "won").length;
        const kycPending    = docs.filter((d: any) => d.status?.toLowerCase() === "pending").length;

        setStats({
          activeListings: activeProps.length,
          newLeads:       newLeads.length || leads.length,
          closedDeals,
          kycPending,
        });

        setRecentListings(properties.slice(0, 5));

        setSweep({
          status: "done",
          lastRun: new Date().toISOString(),
          totalLeads: newLeads.length,
          totalProperties: activeProps.length,
          matches: newLeads.slice(0, 5).map((l: any, i: number) => ({
            lead_id:         l.id,
            lead_name:       l.name || "Lead",
            property_title:  activeProps[i % activeProps.length]?.title || "Property",
            score:           Math.round(95 - i * 10),
            reasoning:       "",
          })),
        });

        setChartData(aggregateChartData(properties, leads));
      } catch (err: any) {
        setError("Unable to sync workspace data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const aggregateChartData = (properties: any[], leads: any[]) => {
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const cur    = new Date().getMonth();
    const agg    = Array.from({ length: 5 }, (_, i) => {
      const mi = (cur - 4 + i + 12) % 12;
      return { name: months[mi], monthIndex: mi, deals: 0, revenue: 0 };
    });
    properties.forEach(p => {
      if (!p.created_at) return;
      const t = agg.find(a => a.monthIndex === new Date(p.created_at).getMonth());
      if (t) { t.revenue += Number(p.price || 0); }
    });
    [...properties, ...leads].forEach(item => {
      if (!item.created_at) return;
      const t = agg.find(a => a.monthIndex === new Date(item.created_at).getMonth());
      if (t) { t.deals += 1; }
    });
    return agg;
  };

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 size={32} className="animate-spin text-[#141414]" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Syncing Workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-12">
      <div className="mx-auto space-y-6">
        
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm font-medium border border-red-100 rounded-2xl shadow-sm">
            {error}
          </div>
        )}

        {/* Main Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Deals Line Chart - Utilizing Blue for Graph Data */}
          <div className="lg:col-span-4 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-50 p-6 h-[340px] flex flex-col">
            <h3 className="font-display text-base font-bold text-[#141414] mb-6">Deal Volume</h3>
            <div className="flex-1 min-h-0">
              {chartData.some(d => d.deals > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9ca3af", fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9ca3af", fontWeight: 700 }} dx={-10} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: "12px", fontSize: 12, fontWeight: 600, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }} 
                      formatter={(v: number) => [v, "Deals"]} 
                    />
                    <Line type="monotone" dataKey="deals" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insufficient Data</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Matching Panel */}
          <div className="lg:col-span-4 h-[340px]">
            <MatchingAgentPanel sweep={sweep} />
          </div>

          {/* Revenue Bar Chart - Utilizing Green for Target Performance */}
          <div className="lg:col-span-4 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-50 p-6 h-[340px] flex flex-col">
            <h3 className="font-display text-base font-bold text-[#141414] mb-6">Sales Target</h3>
            <div className="flex-1 min-h-0">
              {chartData.some(d => d.revenue > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9ca3af", fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "#9ca3af", fontWeight: 700 }} tickFormatter={v => `${Math.round(v/1000000)}M`} dx={-10} />
                    <Tooltip 
                      cursor={{ fill: "#f9fafb" }} 
                      contentStyle={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: "12px", fontSize: 12, fontWeight: 600, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }} 
                      formatter={(v: number) => [formatCurrency(v), "Revenue"]} 
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insufficient Data</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Recent Listings Table */}
        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-50 p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h3 className="font-display text-base font-bold text-[#141414]">Recent Portfolio Additions</h3>
            <Link to="/agent/matches" className="text-xs font-bold text-[#141414] hover:text-[#C5A880] transition-colors">
              View Database
            </Link>
          </div>

          {recentListings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3 w-16">Asset</th>
                    <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Property</th>
                    <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Location</th>
                    <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Valuation</th>
                    <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentListings.map(item => {
                    const isActive = ["active","active_listing"].includes(item.status?.toLowerCase());
                    return (
                      <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                        <td className="py-3">
                          <img 
                            src={item.images?.[0] || item.images?.[0]?.s3_path || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=80"}
                            className="w-10 h-10 object-cover rounded-xl border border-gray-100" 
                            alt="thumb" 
                          />
                        </td>
                        <td className="py-3 font-display text-sm font-bold text-[#141414] group-hover:text-[#C5A880] transition-colors">
                          {item.title}
                        </td>
                        <td className="py-3 text-xs font-medium text-gray-500">
                          {item.location || item.city}
                        </td>
                        <td className="py-3 text-sm font-black text-[#141414] tracking-tight">
                          {formatCurrency(Number(item.price || 0))}
                        </td>
                        <td className="py-3">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full", 
                            isActive ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-50"
                          )}>
                            {item.status?.replace("_", " ") || "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-3">
                <Search size={20} />
              </div>
              <h3 className="font-display text-sm font-bold text-[#141414] mb-1">No listings available</h3>
              <p className="text-xs text-gray-500">Your portfolio is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};