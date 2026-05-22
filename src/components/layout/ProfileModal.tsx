import React from "react";
import { X, Mail, Building, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../lib/AuthContext";

interface ProfileModalProps {
  onClose: () => void;
  userInitials: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, userInitials }) => {
  const { profile, user, logout } = useAuth();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#141414]/40 backdrop-blur-sm flex items-center justify-center p-6 font-sans"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center text-3xl font-bold text-[#141414] mb-4">
            {userInitials.toUpperCase()}
          </div>
          <h2 className="font-display text-xl font-bold text-[#141414]">{profile?.name || "User Account"}</h2>
          <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold capitalize">
            {profile?.role || "Member"} Access
          </span>
          
          <div className="w-full space-y-4 mt-8 mb-8 text-left">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                <Mail size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Email Address</p>
                <p className="text-sm font-medium text-[#141414] truncate">{profile?.email}</p>
              </div>
            </div>

            {profile?.agencyId && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                  <Building size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Agency ID</p>
                  <p className="text-sm font-medium text-[#141414] truncate">{profile.agencyId}</p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};