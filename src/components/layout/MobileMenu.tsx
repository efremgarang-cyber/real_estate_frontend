import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/AuthContext";

interface MobileMenuProps {
  navItems: Array<{ name: string; href: string; icon: any }>;
  onClose: () => void;
  onOpenProfile: () => void;
  userInitials: string;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ navItems, onClose, onOpenProfile, userInitials }) => {
  const { profile } = useAuth();
  const location = useLocation();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-[#141414]/40 backdrop-blur-sm md:hidden font-sans"
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <h1 className="font-display text-xl font-bold text-[#141414]">Menu</h1>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 rounded-xl font-medium transition-all text-base",
                  isActive 
                    ? "bg-[#141414] text-white" 
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <item.icon size={20} className={isActive ? "text-white" : "text-gray-400"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-100">
          <button 
            onClick={() => {
              onClose();
              onOpenProfile();
            }}
            className="w-full flex items-center gap-4 text-left hover:bg-gray-50 p-3 rounded-xl transition-colors -ml-3"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 text-[#141414] flex items-center justify-center font-bold text-lg">
              {userInitials.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#141414] truncate">{profile?.name || "User"}</p>
              <p className="text-sm font-medium text-gray-500 capitalize truncate">{profile?.role || "Member"}</p>
            </div>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};