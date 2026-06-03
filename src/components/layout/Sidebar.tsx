import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Settings, ChevronLeft, ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  navItems: NavItem[];
  onOpenProfile: () => void;
  userInitials: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems, onOpenProfile, userInitials }) => {
  const { profile } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-[88px]" : "w-[280px]"
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        type="button"
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

      {/* Navigation Links */}
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

      {/* Bottom Actions */}
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
          type="button"
          onClick={onOpenProfile}
          title={isCollapsed ? "View Profile" : undefined}
          className={cn(
            "w-full bg-gray-50 border border-gray-100 rounded-2xl flex items-center transition-colors hover:bg-gray-100 relative text-left",
            isCollapsed ? "p-2 justify-center" : "p-4 gap-3"
          )}
        >
          <div className="rounded-full bg-white shadow-sm border border-gray-200 text-[#141414] flex items-center justify-center font-bold text-sm shrink-0 transition-all w-10 h-10">
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
  );
};