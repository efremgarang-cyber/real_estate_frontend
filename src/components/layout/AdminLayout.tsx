import React, { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Building2, ShieldAlert, Menu, Users, Settings, Moon, Sun, Receipt } from "lucide-react"; 
import { useAuth } from "../../lib/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "../../lib/ThemeContext";

import { Sidebar } from "./Sidebar";
import { MobileMenu } from "../layout/MobileMenu";
import { UserProfileModal } from "../UserProfileModal";
import { NotificationDropdown } from "./NotificationDropdown";
import { SecurityStatus } from "./SecurityStatus";

const adminNavItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/admin/properties", icon: Building2 },
  { name: "Pipeline Leads", href: "/admin/leads", icon: Users },
  { name: "Transactions", href: "/admin/transactions", icon: Receipt },
  { name: "Security", href: "/admin/security", icon: ShieldAlert },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const { profile, user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const { isDark, toggleTheme } = useTheme();
  
  const currentPageName = adminNavItems.find(i => location.pathname.startsWith(i.href))?.name || "Console Matrix";
  const userInitials = profile?.name?.[0] || user?.email?.[0] || "A";

  return (
    // UPDATED: Added bg-[#E4E3E0] dark:bg-[#0A0A0A] to cover the entire background
    <div className="flex h-screen bg-[#E4E3E0] dark:bg-[#0A0A0A] font-sans overflow-hidden transition-colors duration-300">
      <Sidebar 
        navItems={adminNavItems} 
        onOpenProfile={() => setShowProfileModal(true)} 
        userInitials={userInitials} 
      />

      {/* UPDATED: Added bg-[#E4E3E0] dark:bg-[#0A0A0A] to ensure the main area is dark */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#E4E3E0] dark:bg-[#0A0A0A]">
        <header className="flex items-center justify-between p-5 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-gray-800 shadow-sm z-20 transition-colors">
          <div className="md:hidden flex items-center gap-2">
            <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-6 h-6 object-contain" />
            <h1 className="font-display text-xl font-bold text-[#141414] dark:text-white">MAKAO ADMIN</h1>
          </div>
          
          <div className="hidden md:block" />

          <div className="flex items-center gap-4">
            <SecurityStatus status="secure" />
            
            <button 
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <NotificationDropdown />

            <button title="mobilemenu"
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <div className="px-6 md:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
           <div>
            <h2 className="font-display text-2xl font-bold text-[#141414] dark:text-white">{currentPageName}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">
              {user?.role === "admin" ? "System Console Workspace" : "Member Workspace"} 
              • {profile?.name?.split(' ')[0] || "User"}
            </p>
          </div>
        </div>

        {/* UPDATED: Added bg-[#E4E3E0] dark:bg-[#0A0A0A] to the scrollable content container */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 bg-[#E4E3E0] dark:bg-[#0A0A0A]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu 
            navItems={adminNavItems}
            onClose={() => setMobileMenuOpen(false)}
            onOpenProfile={() => setShowProfileModal(true)}
            userInitials={userInitials}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <UserProfileModal 
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={logout}
          user={user}
          profile={profile}
        />
      </AnimatePresence>
    </div>
  );
};