import React from "react";
import { X, Building2, Mail, Shield, Calendar, FileCheck2, ShieldAlert, History } from "lucide-react";
import { motion } from "motion/react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // Raw user state from AuthContext
  profile: any; // Context profile array from your me() endpoint
  stats?: {
    totalUploaded: number;
    verifiedDocs: number;
    rejectedDocs: number;
  };
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  profile,
  // Retaining fallback statistics metrics layout until you wire up an aggregation query
  stats = { totalUploaded: 0, verifiedDocs: 0, rejectedDocs: 0 } 
}) => {
  if (!isOpen) return null;

  // Derive stable display fallback contexts from user or profile keys
  const displayName = profile?.name || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "N/A";
  const displayRole = profile?.role || (user?.role ? String(user.role).toUpperCase() : "Member");

  const userInitials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white dark:bg-[#0A0A0A] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-300 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-900 shrink-0">
          <h3 className="font-display text-lg font-bold text-[#141414] dark:text-white">Account Profile</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#141414] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] hover:text-[#141414] dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Avatar & Main Meta */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-50 dark:border-gray-900">
            <div className="w-16 h-16 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
              <span>{userInitials.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <h4 className="text-lg font-bold text-[#141414] dark:text-white truncate">
                {displayName}
              </h4>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                {displayRole}
              </p>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Workspace Details</h5>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-1">
                <Building2 size={16} className="text-gray-400 dark:text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Agency Context</p>
                  <p className="text-sm font-bold text-[#141414] dark:text-white truncate">
                    {profile?.agency?.name || "Standalone Operator"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <Mail size={16} className="text-gray-400 dark:text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Email Communication</p>
                  <p className="text-sm font-bold text-[#141414] dark:text-white truncate">
                    {displayEmail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <Shield size={16} className="text-gray-400 dark:text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Security Access Group</p>
                  <p className="text-sm font-bold text-[#141414] dark:text-white capitalize">
                    {user?.role || "Standard Authority"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Workspace System ID</p>
                  <p className="text-sm font-bold text-[#141414] dark:text-white">
                    {user?.id ? `UID-${String(user.id).padStart(4, '0')}` : "Recent Session"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Stats Grid */}
          <div className="pt-2">
            <h5 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Vault Metrics</h5>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-gray-50 dark:bg-[#141414] rounded-2xl text-left">
                <History size={16} className="text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-2xl font-bold text-[#141414] dark:text-white tracking-tight">{stats.totalUploaded}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Filed</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-[#141414] rounded-2xl text-left">
                <FileCheck2 size={16} className="text-green-600 dark:text-green-500 mb-2" />
                <p className="text-2xl font-bold text-green-600 dark:text-green-500 tracking-tight">{stats.verifiedDocs}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Passed</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-[#141414] rounded-2xl text-left">
                <ShieldAlert size={16} className="text-red-600 dark:text-red-500 mb-2" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-500 tracking-tight">{stats.rejectedDocs}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Flagged</p>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};