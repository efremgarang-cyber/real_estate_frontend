import React, { useState } from "react";
import { useLocation, Outlet, Link } from "react-router-dom";
import { BarChart3, Home, Users, ShieldCheck, Menu, Settings } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { motion, AnimatePresence } from "motion/react";

// Layout Sub-components
import { Sidebar } from "../../components/layout/Sidebar";
import { MobileMenu } from "./MobileMenu";
import { UserProfileModal } from "../UserProfileModal";
const agentNavItems = [
  { name: "Overview", href: "/agent/dashboard", icon: BarChart3 },
  { name: "Properties", href: "/agent/properties", icon: Home },
  { name: "Leads", href: "/agent/leads", icon: Users },
  { name: "KYC Vault", href: "/agent/vault", icon: ShieldCheck },
  { name: "Settings", href: "/agent/settings", icon: Settings },
];

export const AgentLayout: React.FC = () => {
  // FIX 2: Destructure logout method from your AuthContext alongside profile and user
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
        
        <header className="md:hidden flex items-center justify-between p-5 bg-white border-b border-gray-100 shadow-sm z-20">
          <Link to={"/"} className="pointer flex items-center gap-2">
            <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-6 h-6 object-contain" />
            <h1 className="font-display text-xl font-bold text-[#141414]">MAKAO</h1>
          </Link>
          <button title="button"
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="cursor-pointer p-2 text-gray-500 hover:bg-gray-50 rounded-xl"
          >
            <Menu size={24} />
          </button>
        </header>

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

      {/* FIX 3: Inject all required props mapped in UserProfileModalProps interface */}
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