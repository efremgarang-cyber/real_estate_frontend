import React, { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { BarChart3, Home, Users, ShieldCheck, Menu, Settings } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { motion, AnimatePresence } from "motion/react";

// Layout Sub-components
import { Sidebar } from "../../components/layout/Sidebar";
import { MobileMenu } from "./MobileMenu";
import { UserProfileModal } from "../UserProfileModal";
// IMPORT YOUR WIDGET HERE
import { ChatWidget } from "../../components/chat/ChatWidget"; 

const agentNavItems = [
  { name: "Overview", href: "/agent/dashboard", icon: BarChart3 },
  { name: "Properties", href: "/agent/properties", icon: Home },
  { name: "Leads", href: "/agent/leads", icon: Users },
  { name: "KYC Vault", href: "/agent/vault", icon: ShieldCheck },
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
        {/* ... (Header and content code remains identical) ... */}
        <header className="md:hidden flex items-center justify-between p-5 bg-white border-b border-gray-100 shadow-sm z-20">
            {/* ... */}
        </header>

        <div className="px-6 md:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
           {/* ... */}
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} /* ... motion props */ className="h-full">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* INTEGRATED WIDGET */}
      <ChatWidget />

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