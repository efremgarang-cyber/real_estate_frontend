import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Home, 
  Users, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Mail,
  Building
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Properties", href: "/properties", icon: Home },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "KYC Vault", href: "/vault", icon: ShieldCheck },
];

export const Shell: React.FC<LayoutProps> = ({ children }) => {
  const { profile, user, logout } = useAuth();
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
            <h1 className="text-2xl font-black text-[#141414] tracking-tighter">M</h1>
          ) : (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-2xl font-bold text-[#141414] tracking-tight">MAKAO</h1>
              <p className="text-xs font-semibold text-gray-400 tracking-wider mt-1 uppercase">The Agency Platform</p>
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
          
          {/* Settings Button mapped to Sidebar styling */}
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

          {/* User Profile Trigger Button */}
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
          <div>
            <h1 className="text-xl font-bold text-[#141414]">Vantage</h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Dynamic Page Header (Desktop & Mobile) */}
        <div className="px-6 md:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
          <div>
            <h2 className="text-2xl font-bold text-[#141414]">
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#141414]/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
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
                <h1 className="text-xl font-bold text-[#141414]">Menu</h1>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
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
                      onClick={() => setMobileMenuOpen(false)}
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
                    setMobileMenuOpen(false);
                    setShowProfileModal(true);
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
        )}
      </AnimatePresence>

      {/* User Profile & Details Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#141414]/40 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowProfileModal(false)}
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
                onClick={() => setShowProfileModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center text-3xl font-bold text-[#141414] mb-4">
                  {userInitials.toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-[#141414]">{profile?.name || "User Account"}</h2>
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
                      <p className="text-sm font-medium text-[#141414] truncate">{user?.email || "No email provided"}</p>
                    </div>
                  </div>

                  {profile?.agencyId && (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                        <Building size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Workspace / Agency ID</p>
                        <p className="text-sm font-medium text-[#141414] truncate">{profile.agencyId}</p>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => {
                    setShowProfileModal(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors"
                >
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};