import React, { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { BarChart3, Home, Users, ShieldCheck, Menu, Settings, Shield, CreditCard } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { motion, AnimatePresence } from "motion/react";

// Layout Sub-components (Fixed relative paths to prevent Vite transform 500 errors)
import { Sidebar } from "./Sidebar";
import { MobileMenu } from "./MobileMenu";
import { UserProfileModal } from "../UserProfileModal";
import { ChatWidget } from "../chat/ChatWidget"; 

const agentNavItems = [
  { name: "Overview", href: "/agent/dashboard", icon: BarChart3 },
  { name: "Properties", href: "/agent/properties", icon: Home },
  { name: "Leads", href: "/agent/leads", icon: Users },
  { name: "KYC Vault", href: "/agent/vault", icon: ShieldCheck },
  { name: "Escrow Vault", href: "/agent/escrows", icon: Shield },
  { name: "Plans", href: "/agent/plans", icon: CreditCard },
  { name: "Settings", href: "/agent/settings", icon: Settings },
];

export const AgentLayout: React.FC = () => {
  const { profile, user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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
        {/* Mobile Responsive Header */}
        <header className="md:hidden flex items-center justify-between p-5 bg-white border-b border-gray-100 shadow-sm z-20">
          <button title="mobile"
            onClick={() => setMobileMenuOpen(true)} 
            className="text-gray-500 hover:text-[#141414] dark:hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
          <span className="font-bold text-sm tracking-tight text-[#141414]">{currentPageName}</span>
          <button 
            onClick={() => setShowProfileModal(true)}
            className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold text-xs"
          >
            {userInitials.toUpperCase()}
          </button>
        </header>

        {/* Workspace Context Header */}
        <div className="px-6 md:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#141414]">{currentPageName}</h1>
          </div>
        </div>

        {/* Dynamic Page Content Routing Target */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname} 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Integrated Live Communication Layer */}
      <ChatWidget />

      {/* Responsive Mobile Sheet Dropdown Drawer */}
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

      {/* Profile Management Interface Dialog Sheet */}
      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal 
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onLogout={logout}
            user={user}
            profile={profile}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default AgentLayout;