import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Home, 
  Users, 
  ShieldCheck, 
  Settings, 
  Menu,
  ChevronLeft,
  ChevronRight,
  CreditCard 
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";

// Sub-components
import { MobileMenu } from "./MobileMenu";
import { ProfileModal } from "./ProfileModal";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Overview", href: "/dashboard", icon: BarChart3 },
  { name: "Properties", href: "/properties", icon: Home },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Escrows", href: "/escrows", icon: ShieldCheck },
  { name: "Plans", href: "/subscriptions", icon: CreditCard }, // Standardized to match router
  { name: "KYC Vault", href: "/vault", icon: ShieldCheck },
];

export const Shell: React.FC<LayoutProps> = ({ children }) => {
  const { profile, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const currentPageName = navItems.find(i => i.href === location.pathname)?.name || "Vantage OS";
  const userInitials = profile?.name?.[0] || user?.email?.[0] || "U";

  return (
    <div className="flex h-screen bg-[#E4E3E0] font-sans overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 transition-all duration-300 ease-in-out relative",
          isCollapsed ? "w-[88px]" : "w-[280px]"
        )}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-9 w-7 h-7 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center text-gray-400 hover:text-[#141414] hover:border-gray-300 hover:shadow transition-all z-50"
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        {/* Header/Logo */}
        <div className={cn("p-8 pb-6 transition-all duration-300", isCollapsed ? "px-0 text-center" : "px-8")}>
          {isCollapsed ? (
            <div className="flex flex-col items-center justify-center">
              <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-8 h-8 object-contain" />
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-8 h-8 object-contain" />
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#141414] tracking-tight leading-none">MAKAO</h1>
                  <p className="text-[10px] font-semibold text-gray-400 tracking-wider mt-1 uppercase">The Agency Platform</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center rounded-xl font-medium transition-all text-sm group overflow-hidden whitespace-nowrap",
                  isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3.5",
                  isActive 
                    ? "bg-[#141414] text-white shadow-md" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-[#141414]"
                )}
              >
                <item.icon size={20} className={cn("shrink-0", isActive ? "text-white" : "text-gray-400 group-hover:text-[#141414]")} />
                
                {!isCollapsed && (
                  <span className="animate-in fade-in duration-300">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions: Settings & User Profile */}
        <div className="mt-auto flex flex-col gap-2 p-4 mb-4">
          <Link
            to="/settings"
            title={isCollapsed ? "Settings" : undefined}
            className={cn(
              "flex items-center rounded-xl font-medium transition-all text-sm group overflow-hidden whitespace-nowrap text-gray-500 hover:bg-gray-50 hover:text-[#141414]",
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3.5"
            )}
          >
            <Settings size={20} className="shrink-0 text-gray-400 group-hover:text-[#141414]" />
            {!isCollapsed && (
              <span className="animate-in fade-in duration-300">
                Settings
              </span>
            )}
          </Link>

          <button 
            onClick={() => setShowProfileModal(true)}
            title={isCollapsed ? "View Profile" : undefined}
            className={cn(
              "w-full bg-gray-50 border border-gray-100 rounded-2xl flex items-center transition-colors hover:bg-gray-100 relative text-left",
              isCollapsed ? "p-2 justify-center" : "p-4 gap-3"
            )}
          >
            <div className={cn(
              "rounded-full bg-white shadow-sm border border-gray-200 text-[#141414] flex items-center justify-center font-bold text-sm shrink-0 transition-all",
              isCollapsed ? "w-10 h-10" : "w-10 h-10"
            )}>
              <span>{userInitials.toUpperCase()}</span>
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                <p className="text-sm font-bold text-[#141414] truncate">{profile?.name || "User"}</p>
                <p className="text-xs font-medium text-gray-500 truncate capitalize">{profile?.role || "Member"}</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header - Mobile Toggle */}
        <header className="md:hidden flex items-center justify-between p-5 bg-white border-b border-gray-100 shadow-sm z-20">
          <div className="flex items-center gap-2">
            <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-6 h-6 object-contain" />
            <h1 className="font-display text-xl font-bold text-[#141414]">MAKAO</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl"
            title="Menu"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Dynamic Page Header */}
        <div className="px-6 md:px-10 pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#141414]">
              {currentPageName}
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-1">
              Welcome back, {profile?.name?.split(' ')[0] || "User"}
            </p>
          </div>
        </div>

        {/* Page Content Viewport */}
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
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu 
            navItems={navItems}
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