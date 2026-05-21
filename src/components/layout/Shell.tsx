import React from "react";
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
  Plus
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
  const { profile, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-[#E4E3E0]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#141414] bg-white">
        <div className="p-6 border-b border-[#141414]">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Vantage</h1>
          <p className="text-[10px] font-mono text-gray-500 uppercase mt-1 italic">Real Estate OS</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 font-medium transition-all",
                  isActive 
                    ? "bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" 
                    : "hover:bg-gray-100"
                )}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#141414]">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-8 h-8 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-bold">
              {profile?.displayName?.[0] || profile?.email?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{profile?.displayName}</p>
              <p className="text-[10px] font-mono whitespace-nowrap text-gray-500 uppercase">{profile?.role}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="text-gray-400 hover:text-[#141414] transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Mobile Toggle */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[#141414] bg-white">
          <h1 className="text-xl font-black uppercase">Vantage</h1>
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </header>

        {/* Dynamic Page Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#141414] bg-[#E4E3E0]">
          <div>
            <h2 className="text-sm font-mono uppercase text-gray-500 italic">
              {navItems.find(i => i.href === location.pathname)?.name || "Vantage OS"}
            </h2>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2 text-xs">
              <Plus size={14} /> New Listing
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white md:hidden"
          >
            <div className="p-6 flex items-center justify-between border-b border-[#141414]">
              <h1 className="text-2xl font-black uppercase">Vantage</h1>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="p-6 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 py-4 text-xl font-bold border-b border-gray-100"
                >
                  <item.icon size={24} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
