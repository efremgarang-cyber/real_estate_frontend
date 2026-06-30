import React, { useState, useEffect } from "react";
import { 
  Users, 
  Building2, 
  ShieldAlert, 
  Search,
  DollarSign,
  Scale,
  ChevronRight,
  Eye,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Home
} from "lucide-react";
import { api } from "../../lib/api";
import { useNavigate } from "react-router-dom";

export const AdminDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // ✅ Dynamic state mapping to your single backend response layout
  const [stats, setStats] = useState({
    total_users: 0,
    total_agencies: 0,
    pending_kyc: 0,
    disputes_count: 0,
    total_locked_volume: 0,
    platform_revenue: 0,
    total_properties: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [pendingDisputes, setPendingDisputes] = useState<any[]>([]);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const hubResponse = await api.get('/admin/dashboard-hub');
      const hubData = hubResponse.data;
      
      // Mapping backend response keys to frontend state
      setStats({
        total_users: hubData.users_count || 0,
        total_agencies: hubData.agencies_count || 0,
        pending_kyc: hubData.pending_kyc_count || 0,
        disputes_count: hubData.disputes_count || 0,
        total_locked_volume: hubData.escrows_count || 0,
        platform_revenue: hubData.platform_revenue || 0,
        total_properties: hubData.properties_count || 0
      });
      
      setPendingDisputes(hubData.disputes || []);
      setRecentLogs(hubData.recent_logs || []);
      setRecentProperties(hubData.recent_properties || []);
      
    } catch (error) {
      console.error("Failed to fetch dashboard metrics pipeline:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ✅ Client-side audit log query filter
  const filteredLogs = recentLogs.filter((log) => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Handles fast arbitration overrides
  const handleResolveDispute = async (disputeId: number, action: 'refund_to_buyer' | 'released_to_seller') => {
    const notes = prompt("Enter legal justification for this resolution:");
    if (!notes || notes.length < 10) {
      alert("Please provide at least 10 characters of justification.");
      return;
    }

    try {
      await api.post(`/admin/disputes/${disputeId}/resolve`, {
        resolution: action,
        admin_notes: notes
      });
      
      alert("Arbitration resolution processed successfully.");
      await fetchDashboardData();
      
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
      alert("Failed to resolve dispute. Please check logs and try again.");
    }
  };

  // Navigation handlers
  const navigateTo = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Loading administration ecosystem hub...</p>
        </div>
      </div>
    );
  }

  const statsData = [
    { 
      title: "Total System Users", 
      value: stats.total_users.toLocaleString(), 
      change: "Active", 
      isPositive: true, 
      icon: Users, 
      desc: "Active clients and registered agents",
      path: "/admin/users",
      action: "View Users"
    },
    { 
      title: "Corporate Agencies", 
      value: stats.total_agencies.toLocaleString(), 
      change: "Registered", 
      isPositive: true, 
      icon: Building2, 
      desc: "Active business tenant workspaces",
      path: "/admin/agencies",
      action: "View Agencies"
    },
    { 
      title: "Total Properties", 
      value: stats.total_properties.toLocaleString(), 
      change: "Listed", 
      isPositive: true, 
      icon: Home, 
      desc: "Active property listings",
      path: "/admin/properties",
      action: "View Properties"
    },
    { 
      title: "Active Disputes", 
      value: stats.disputes_count.toString(), 
      change: stats.disputes_count === 0 ? "✓ Clear" : "⚠ Required", 
      isPositive: stats.disputes_count === 0, 
      icon: Scale, 
      desc: "Pending arbitration cases",
      path: "/admin/disputes",
      action: "View Disputes"
    }
  ];

  return (
    <div className="w-full font-sans text-[#141414] dark:text-gray-100">
      {/* ── UTILITIES ACTION BAR ── */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit trail logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-4 py-2.5 w-full bg-white dark:bg-[#141414] border border-neutral-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
          />
        </div>
        {/* ── REMOVED "Add Property" Button ── */}
      </div>

      {/* ── SYSTEM MATRIX CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statsData.map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={i} 
              className="group bg-white dark:bg-[#141414] p-6 rounded-[1.75rem] border border-neutral-200 dark:border-gray-800 flex flex-col justify-between hover:shadow-lg hover:border-black dark:hover:border-white transition-all cursor-pointer"
              onClick={() => stat.path && navigateTo(stat.path)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-11 h-11 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black group-hover:scale-110 transition-transform">
                  <IconComponent size={20} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  stat.isPositive 
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' 
                    : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.title}</p>
              <h3 className="font-display text-3xl font-bold mt-1">{stat.value}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.desc}</p>
              <div className="mt-4 flex items-center text-xs font-medium text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                <span>{stat.action}</span>
                <ArrowUpRight size={14} className="ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── WORKSPACE PANELS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Disputes Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-[#141414] rounded-[2rem] border border-neutral-200 dark:border-gray-800 p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">Active Disputes</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                pendingDisputes.length > 0 
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' 
                  : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
              }`}>
                {pendingDisputes.length} pending
              </span>
            </div>
            <button 
              onClick={() => navigateTo("/admin/disputes")}
              className="text-xs text-gray-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          
          {pendingDisputes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500 opacity-50" />
              <p className="font-medium">No active disputes</p>
              <p className="text-sm text-gray-400">All clear! ✓</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDisputes.slice(0, 5).map((dispute) => (
                <div key={dispute.id} className="p-4 rounded-2xl border border-neutral-100 dark:border-gray-700 bg-neutral-50 dark:bg-[#1A1A1A] hover:border-black dark:hover:border-white transition-colors">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          #{dispute.id}
                        </span>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                          <Clock size={10} /> Pending
                        </span>
                      </div>
                      <p className="text-sm font-semibold">{dispute.reason || 'No reason provided'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Filed by: {dispute.raised_by?.name || `User #${dispute.raised_by_id}`} 
                        • Escrow #{dispute.escrow_id}
                      </p>
                    </div>
                    <div className="flex gap-2 h-fit">
                      <button 
                        onClick={() => handleResolveDispute(dispute.id, 'refund_to_buyer')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Refund Buyer
                      </button>
                      <button 
                        onClick={() => handleResolveDispute(dispute.id, 'released_to_seller')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Release to Seller
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingDisputes.length > 5 && (
                <div className="text-center pt-2">
                  <button 
                    onClick={() => navigateTo("/admin/disputes")}
                    className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                  >
                    + {pendingDisputes.length - 5} more disputes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security / System Activity Logs Panel */}
        <div className="bg-white dark:bg-[#141414] rounded-[2rem] border border-neutral-200 dark:border-gray-800 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Recent Activity</h2>
            <button 
              onClick={() => navigateTo("/admin/logs")}
              className="text-xs text-gray-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShieldAlert size={48} className="mx-auto mb-4 opacity-30" />
              <p>No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {filteredLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="border-b border-neutral-100 dark:border-gray-800 pb-3 last:border-0 hover:bg-neutral-50 dark:hover:bg-[#1A1A1A] -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{log.action || 'System Action'}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {log.description || 'No description'}
                      </p>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                          {log.user_name || 'System Auto'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK ACTIONS BAR ── */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button 
          onClick={() => navigateTo("/admin/properties")}
          className="p-4 bg-white dark:bg-[#141414] rounded-2xl border border-neutral-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Home size={18} />
          Manage Properties
        </button>
        <button 
          onClick={() => navigateTo("/admin/users")}
          className="p-4 bg-white dark:bg-[#141414] rounded-2xl border border-neutral-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Users size={18} />
          Manage Users
        </button>
        <button 
          onClick={() => navigateTo("/admin/agencies")}
          className="p-4 bg-white dark:bg-[#141414] rounded-2xl border border-neutral-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Building2 size={18} />
          Manage Agencies
        </button>
        <button 
          onClick={() => navigateTo("/admin/security")}
          className="p-4 bg-white dark:bg-[#141414] rounded-2xl border border-neutral-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all flex items-center justify-center gap-2 text-sm font-medium"
        >
          <ShieldAlert size={18} />
          Security Settings
        </button>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 9999px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};