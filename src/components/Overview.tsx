import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Home as HomeIcon,
  Users as UsersIcon,
  Shield as ShieldIcon,
  Loader2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { PropertyMatchesWidget } from "./PropertyMatchesWidget";
import { formatCurrency, cn } from "../lib/utils";
// API Imports 
import { propertyApi } from "../api/properties";
import { leadApi } from "../api/leads";
import { documentApi } from "../api/documents";
import { authApi } from "../api/auth";

export const DashboardOverview: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    activeListings: 0,
    newLeads: 0,
    closedDeals: 0,
    kycPending: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [recentListings, setRecentListings] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // 1. Fire parallel requests to gather all necessary data
        const [userRes, propsRes, leadsRes] = await Promise.allSettled([
          authApi.getCurrentUser(),
          propertyApi.getAgencyProperties(1),
          leadApi.getAll(1),
        ]);

        // Helper to extract arrays safely from Laravel paginated responses
        const extractData = (res: any) => {
          if (res.status !== "fulfilled") return [];
          const payload = res.value;
          if (Array.isArray(payload)) return payload;
          if (payload?.data && Array.isArray(payload.data)) return payload.data;
          if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data;
          return [];
        };

        const properties = extractData(propsRes);
        const leads = extractData(leadsRes);

        let docs: any[] = [];

        // 2. Fetch documents if we successfully retrieved the user's agency ID
        if (userRes.status === "fulfilled") {
          const profile = userRes.value.profile;
          // Support both camelCase and snake_case depending on your backend transformer
          const agencyId = profile?.agencyId || (profile as any)?.agency_id;

          if (agencyId) {
            try {
              const docsRes = await documentApi.getAgencyDocuments({ agencyId: String(agencyId) });
              docs = Array.isArray(docsRes.data?.data) ? docsRes.data.data : [];
            } catch (err) {
              console.warn("Failed to fetch documents", err);
            }
          }
        }

        // 3. Compute Top-Level Stats
        const activeListingsCount = properties.filter((p: any) => p.status?.toLowerCase() === "active").length;
        const newLeadsCount = leads.filter((l: any) => l.kanban_stage === "new" || l.status === "new").length;
        const closedDealsCount = properties.filter((p: any) => p.status?.toLowerCase() === "under_contract" || p.status?.toLowerCase() === "sold").length
          + leads.filter((l: any) => l.kanban_stage?.toLowerCase() === "won").length;
        const kycPendingCount = docs.filter((d: any) => d.status?.toLowerCase() === "pending").length;

        setStats({
          activeListings: activeListingsCount,
          newLeads: newLeadsCount || leads.length, // Fallback to all leads if no strict 'new' stage exists
          closedDeals: closedDealsCount,
          kycPending: kycPendingCount,
        });

        // 4. Populate Recent Listings Grid (Latest 3)
        setRecentListings(properties.slice(0, 3));

        // 5. Aggregate Chart Data (Group by Month based on created_at)
        const monthlyData = aggregateChartData(properties, leads);
        setChartData(monthlyData);

      } catch (err: any) {
        console.error("Dashboard Aggregation Error:", err);
        setError("Unable to sync live workspace data. Some metrics may be unavailable.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to build timeline charts dynamically
  const aggregateChartData = (properties: any[], leads: any[]) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();

    // Create a base array for the last 5 months up to the current month
    const aggregated = Array.from({ length: 5 }, (_, i) => {
      const monthIndex = (currentMonth - 4 + i + 12) % 12;
      return {
        name: months[monthIndex],
        monthIndex,
        deals: 0,
        revenue: 0
      };
    });

    // Tally Property Revenue
    properties.forEach((p) => {
      if (!p.created_at) return;
      const date = new Date(p.created_at);
      const target = aggregated.find(a => a.monthIndex === date.getMonth() && date.getFullYear() === new Date().getFullYear());
      if (target) {
        target.revenue += Number(p.price || 0);
      }
    });

    // Tally Deals (Leads + Properties)
    [...properties, ...leads].forEach((item) => {
      if (!item.created_at) return;
      const date = new Date(item.created_at);
      const target = aggregated.find(a => a.monthIndex === date.getMonth() && date.getFullYear() === new Date().getFullYear());
      if (target) {
        target.deals += 1;
      }
    });

    return aggregated;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#141414]" />
        <p className="text-sm font-medium">Syncing real-time workspace metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Active Listings"
          value={stats.activeListings.toString()}
          trend="+12%"
          icon={HomeIcon}
        />
        <StatCard
          label="New Leads"
          value={stats.newLeads.toString()}
          trend="+24%"
          icon={UsersIcon}
        />
        <StatCard
          label="Closed Deals"
          value={stats.closedDeals.toString()}
          trend="+8%"
          icon={TrendingUp}
        />
        <StatCard
          label="KYC Pending"
          value={stats.kycPending.toString()}
          trend={stats.kycPending > 0 ? "-2" : "0"}
          icon={ShieldIcon}
          trendInverse
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-gray-400 mb-8">Revenue performance</h3>
          <div className="h-[300px]">
            {chartData.some(d => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: '#9ca3af' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: '#9ca3af' }}
                    tickFormatter={(val) => `KES ${val / 1000000}M`}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #f3f4f6',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                      color: '#141414',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#141414" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400 font-medium">Insufficient revenue data</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-gray-400 mb-8">Deal volume</h3>
          <div className="h-[300px]">
            {chartData.some(d => d.deals > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: '#9ca3af' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: '#9ca3af' }}
                    dx={-10}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #f3f4f6',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                      color: '#141414',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                    formatter={(value: number) => [value, "Total Deals"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="deals"
                    stroke="#141414"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#ffffff", strokeWidth: 2, stroke: "#141414" }}
                    activeDot={{ r: 6, fill: "#141414", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400 font-medium">Insufficient deal volume data</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Listings Grid */}
      <div>
        {/* AI Matches (1 Column) */}
        <div className="lg:col-span-1">
          <PropertyMatchesWidget />
        </div>

        {/* Recent Listings (2 Columns) */}    
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl font-bold text-[#141414]">Recent Listings</h3>
            <Link to="/properties" className="text-sm font-semibold text-gray-500 hover:text-[#141414] transition-colors">
              View all
            </Link>
          </div>

          {recentListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentListings.map((item) => (
                <Link
                  key={item.id}
                  to={`/properties/${item.id}`}
                  className="bg-white rounded-[2rem] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100 group cursor-pointer hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all flex flex-col"
                >
                  <div className="relative aspect-video bg-gray-100 mb-5 overflow-hidden rounded-2xl shrink-0">
                    <img
                      src={item.images?.[0]?.url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      alt={item.title}
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-display font-bold text-lg text-[#141414] leading-tight pr-4 line-clamp-1">{item.title}</h4>
                        <span className={cn(
                          "font-bold uppercase text-xs tracking-wider shrink-0 mt-1",
                          item.status?.toLowerCase() === 'active' ? "text-green-600" : "text-gray-400"
                        )}>
                          {item.status ? item.status.replace('_', ' ') : 'UNKNOWN'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-500 line-clamp-1">{item.location || item.address}</p>
                    </div>
                    <div className="mt-auto">
                      <span className="text-xl font-bold text-[#141414]">{formatCurrency(Number(item.price || 0))}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-medium text-sm">
              No recent properties listed yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, icon: Icon, trendInverse = false }: any) => {
  const isPositive = String(trend).startsWith("+");
  const trendingColor = trendInverse
    ? (isPositive ? "text-red-500" : "text-green-500")
    : (isPositive ? "text-green-500" : "text-red-500");

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100 flex items-start justify-between transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-bold text-[#141414]">{value}</p>
        <p className={cn("text-sm font-medium mt-2 flex items-center gap-1.5", trendingColor)}>
          {trend} <span className="text-gray-400 text-xs">from last month</span>
        </p>
      </div>
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#141414] shrink-0">
        <Icon size={20} />
      </div>
    </div>
  );
};