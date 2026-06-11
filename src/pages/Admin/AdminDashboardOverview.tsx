import React, { useState } from "react";
import { 
  Users, 
  Building2, 
  FileCheck2, 
  ShieldAlert, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";

// Mock Data
const statsData = [
  { title: "Total System Users", value: "1,248", change: "+12.4%", isPositive: true, icon: Users, desc: "Active clients and registered agents" },
  { title: "Corporate Agencies", value: "42", change: "+4.3%", isPositive: true, icon: Building2, desc: "Active business tenant workspaces" },
  { title: "KYC Compliance Queue", value: "7", change: "-2 entries", isPositive: true, icon: FileCheck2, desc: "Awaiting administrative authorization" },
  { title: "Security Incidents", value: "0", change: "Stable", isPositive: true, icon: ShieldAlert, desc: "Workstation authorization alerts" }
];

const recentLogs = [
  { id: "LOG-9021", action: "User Clearance Escalation", target: "agent.doe@makao.co.ke", status: "Success", time: "12 mins ago" },
  { id: "LOG-9020", action: "New Agency Core Initialized", target: "Makao Prime Properties Ltd", status: "Success", time: "45 mins ago" },
  { id: "LOG-9019", action: "MinIO S3 Payload Policy Update", target: "Storage Bucket: Vault Core", status: "Updated", time: "2 hours ago" },
  { id: "LOG-9018", action: "Failed Authentication Attempt", target: "IP: 197.248.31.91 (Workstation)", status: "Blocked", time: "4 hours ago" },
];

const pendingKyc = [
  { id: "KYC-082", name: "Apex Realty Group", representative: "Alex Kiprop", submitted: "Today, 08:14 AM" },
  { id: "KYC-081", name: "Elysian Spaces Kenya", representative: "Muthoni Corporate Law", submitted: "Yesterday" },
  { id: "KYC-079", name: "Rift Valley Holdings", representative: "David Ndereba", submitted: "2 days ago" },
];

export const AdminDashboardOverview: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = recentLogs.filter((log) => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full font-sans text-[#141414] dark:text-gray-100">
      {/* ── UTILITIES ACTION BAR ── */}
      <div className="flex justify-end gap-4 mb-8">
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit trail logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-4 py-2.5 w-full bg-white dark:bg-[#141414] border border-neutral-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all"
          />
        </div>
      </div>

      {/* ── SYSTEM MATRIX CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statsData.map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-[#141414] p-6 rounded-[1.75rem] border border-neutral-200 dark:border-gray-800 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-11 h-11 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black">
                  <IconComponent size={20} />
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stat.change}</span>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase">{stat.title}</p>
              <h3 className="font-display text-3xl font-bold mt-1">{stat.value}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ── WORKSPACE PANELS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compliance Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-[#141414] rounded-[2rem] border border-neutral-200 dark:border-gray-800 p-8">
          <h2 className="text-lg font-bold mb-6">KYC Verification Approvals</h2>
          <div className="space-y-4">
            {pendingKyc.map((kyc) => (
              <div key={kyc.id} className="p-4 rounded-2xl border border-neutral-100 dark:border-gray-700 bg-neutral-50 dark:bg-[#1A1A1A] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">{kyc.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{kyc.submitted}</p>
                </div>
                <button className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium">Authorize</button>
              </div>
            ))}
          </div>
        </div>

        {/* Security Logs Panel */}
        <div className="bg-white dark:bg-[#141414] rounded-[2rem] border border-neutral-200 dark:border-gray-800 p-8">
          <h2 className="text-lg font-bold mb-6">Security Audit Logs</h2>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="border-b border-neutral-100 dark:border-gray-700 pb-3">
                <p className="text-xs font-semibold">{log.action}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{log.target} • {log.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};