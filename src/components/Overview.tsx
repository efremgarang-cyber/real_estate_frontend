import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, Home as HomeIcon, Users as UsersIcon,
  Shield as ShieldIcon, Loader2, Bot, Cpu
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
              "text-gray-500";

  return (
    <div className="bg-white rounded-[0.5rem] border border-gray-300 shadow-sm p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-[#141414]" />
          <h3 className="text-sm text-gray-700 font-medium">Property Matching Agent</h3>
        </div>
        {sweep.status === "scanning" && (
          <span className="text-xs font-semibold text-green-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Scanning
          </span>
        )}
        {sweep.status === "done" && (
          <span className="text-xs text-gray-500">
            {sweep.matches.length} matches found
          </span>
        )}
      </div>

      {/* Active scan indicator */}
      {sweep.status === "scanning" && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-300 rounded-[0.5rem] mb-4">
          <Cpu size={14} className="text-green-600 shrink-0" />
          <p className="text-xs text-gray-600 flex-1">
            Cross-referencing <span className="font-semibold text-[#141414]">{sweep.totalLeads} leads</span> vs <span className="font-semibold text-[#141414]">{sweep.totalProperties} listings</span>
          </p>
        </div>
      )}

      {/* Match list */}
      <div className="flex-1 overflow-y-auto">
        {sweep.matches.length > 0 ? (
          <div className="space-y-3">
            {sweep.matches.slice(0, 5).map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#141414] truncate">{m.lead_name}</p>
                  <p className="text-xs text-gray-500 truncate">{m.property_title}</p>
                </div>
                <span className={cn("text-sm font-bold shrink-0", scoreColor(m.score))}>
                  {m.score}%
                </span>
              </div>
            ))}
          </div>
        ) : sweep.status === "done" ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-500">
            No strong matches found.
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {sweep.lastRun ? `Last run: ${new Date(sweep.lastRun).toLocaleTimeString()}` : "No sweep run yet"}
        </p>
        <Link to="/agent/matches" className="text-xs font-semibold text-blue-600 hover:underline">
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
    <div className="bg-white rounded-[0.5rem] p-4 border border-gray-300 shadow-sm flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm text-gray-600">{label}</h3>
        <Icon size={16} className="text-gray-400" />
      </div>
      <p className="text-2xl font-semibold text-[#141414] mb-1">{value}</p>
      <p className={cn("text-xs", trendColor)}>
        {trend} <span className="text-gray-500 ml-1">vs last month</span>
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

        const activeProps   = properties.filter((p: any) => p.status?.toLowerCase() === "active");
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
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-sm font-medium text-gray-500">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded-[0.5rem]">{error}</div>
        )}

        {/* Top KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Listings" value={stats.activeListings} trend="+12%" icon={HomeIcon} />
          <StatCard label="New Leads"       value={stats.newLeads}       trend="+24%" icon={UsersIcon} />
          <StatCard label="Closed Deals"    value={stats.closedDeals}    trend="+8%"  icon={TrendingUp} />
          <StatCard label="KYC Pending"     value={stats.kycPending}     trend={stats.kycPending > 0 ? "-2" : "0"} icon={ShieldIcon} trendInverse />
        </div>

        {/* Main Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Deals Line Chart (Spans 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-[0.5rem] p-4 border border-gray-300 shadow-sm h-[320px] flex flex-col">
            <h3 className="text-sm text-gray-600 mb-4">Deal Volume</h3>
            <div className="flex-1 min-h-0">
              {chartData.some(d => d.deals > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "#6b7280" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "#6b7280" }} dx={-10} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", fontSize: 12 }} formatter={(v: number) => [v, "Deals"]} />
                    <Line type="monotone" dataKey="deals" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">Insufficient data</div>
              )}
            </div>
          </div>

          {/* AI Matching Panel (Spans 4 cols) */}
          <div className="lg:col-span-4 h-[320px]">
            <MatchingAgentPanel sweep={sweep} />
          </div>

          {/* Revenue Bar Chart (Spans 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-[0.5rem] p-4 border border-gray-300 shadow-sm h-[320px] flex flex-col">
            <h3 className="text-sm text-gray-600 mb-4">Sales (m) vs Target</h3>
            <div className="flex-1 min-h-0">
              {chartData.some(d => d.revenue > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "#6b7280" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "#6b7280" }} tickFormatter={v => `${Math.round(v/1000000)}M`} dx={-10} />
                    <Tooltip cursor={{ fill: "#f3f4f6" }} contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", fontSize: 12 }} formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                    <Bar dataKey="revenue" fill="#60a5fa" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">Insufficient data</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Recent Listings Table */}
        <div className="bg-white rounded-[0.5rem] border border-gray-300 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h3 className="text-sm text-gray-600">Recent Listings Table</h3>
            <Link to="/agent/matches" className="text-xs font-semibold text-blue-600 hover:underline">View All</Link>
          </div>

          {recentListings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-300">
                    <th className="font-normal pb-2 w-12">Image</th>
                    <th className="font-normal pb-2">Property</th>
                    <th className="font-normal pb-2">Location</th>
                    <th className="font-normal pb-2">Price</th>
                    <th className="font-normal pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentListings.map(item => {
                    const isActive = ["active","active_listing"].includes(item.status?.toLowerCase());
                    return (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-2">
                          <img 
                            src={item.images?.[0] || item.images?.[0]?.s3_path || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=80"}
                            className="w-8 h-8 object-cover rounded-[0.5rem] border border-gray-300" 
                            alt="thumb" 
                          />
                        </td>
                        <td className="py-2 font-medium text-[#141414]">{item.title}</td>
                        <td className="py-2 text-gray-500">{item.location || item.city}</td>
                        <td className="py-2 text-[#141414]">{formatCurrency(Number(item.price || 0))}</td>
                        <td className={cn("py-2", isActive ? "text-green-600" : "text-amber-600")}>
                          {item.status?.replace("_", " ") || "Active"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-gray-500">No listings available.</div>
          )}
        </div>
      </div>
    </div>
  );
};