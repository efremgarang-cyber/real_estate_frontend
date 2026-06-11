import React, { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { BarChart3, Home, Users, ShieldCheck, Menu, Settings } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { motion, AnimatePresence } from "motion/react";

// Layout Sub-components
import { Sidebar } from "../../components/layout/Sidebar";
import { MobileMenu } from "./MobileMenu";
import { ProfileModal } from "./ProfileModal";

// Specific routes handled by the Agent Portal
const agentNavItems = [
  { name: "Overview", href: "/agent/dashboard", icon: BarChart3 },
  { name: "Properties", href: "/agent/properties", icon: Home },
  { name: "Leads", href: "/agent/leads", icon: Users },
  { name: "KYC Vault", href: "/agent/vault", icon: ShieldCheck },
  { name: "Settings", href: "/agent/settings", icon: Settings },
];

export const AgentLayout: React.FC = () => {
  const { profile, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Use startsWith to handle sub-routes correctly
  const currentPageName = agentNavItems.find(i => location.pathname.startsWith(i.href))?.name || "Vantage OS";
  const userInitials = profile?.name?.[0] || user?.email?.[0] || "U";

  return (
    <div className="flex h-screen bg-[#E4E3E0] font-sans overflow-hidden">
      
      <Sidebar 
        navItems={agentNavItems} 
        onOpenProfile={() => setShowProfileModal(true)} 
        userInitials={userInitials} 
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        <header className="md:hidden flex items-center justify-between p-5 bg-white border-b border-gray-100 shadow-sm z-20">
          <div className="flex items-center gap-2">
            <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-6 h-6 object-contain" />
            <h1 className="font-display text-xl font-bold text-[#141414]">MAKAO</h1>
          </div>
          <button title="button"
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Dynamic Page Header with Role-Based Workspace Context */}
        <div className="px-6 md:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#141414]">
              {currentPageName}
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-1 capitalize">
              {user?.role?.toLowerCase() === "admin" ? "Administrative Workspace" : "Agent Workspace"} 
              • {profile?.name?.split(' ')[0] || "User"}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10">
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
            navItems={agentNavItems}
            onClose={() => setMobileMenuOpen(false)}
            onOpenProfile={() => setShowProfileModal(true)}
            userInitials={userInitials}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal 
            onClose={() => setShowProfileModal(false)}
            userInitials={userInitials}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default AgentLayout;