import React, { useState, useEffect } from "react";
import { 
  User as UserIcon, Lock, Save, Loader2, 
  ShieldCheck, Bell, CreditCard, Palette, 
  AlertCircle, CheckCircle2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

// Import modularized components
import { ProfileSettings } from "./ProfileSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { NotificationSettings } from "./NotificationSettings";
import { RolesSettings } from "./RolesSettings";
import { SecuritySettings } from "./SecuritySettings";

// ── 1. THE WRAPPER ──
export const Settings = () => {
  const { user, profile } = useAuth();

  if (!user && !profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          Loading workspace configuration...
        </div>
      </div>
    );
  }

  return <SettingsUI user={user} profile={profile} />;
};

// ── 2. THE UI COMPONENT ──
interface SettingsProps {
  user: any;     
  profile: any;  
  onProfileUpdate?: () => void; 
}

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const BASE_MENU_ITEMS: SettingsSection[] = [
  { id: "profile", label: "Profile", icon: <UserIcon size={16} />, description: "Manage your personal information" },
  { id: "appearance", label: "Appearance", icon: <Palette size={16} />, description: "Customize your workspace UI" },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} />, description: "Configure alerts and digests" },
  { id: "roles", label: "Roles & Permissions", icon: <ShieldCheck size={16} />, description: "Configure access control levels" },
  { id: "security", label: "Security", icon: <Lock size={16} />, description: "2FA and active session management" },
];

const SettingsUI: React.FC<SettingsProps> = ({ user, profile, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_path ? `http://localhost:8000/storage/${user.avatar_path}` : null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resolveField = (field: "name" | "email" | "role"): string => {
    return profile?.[field] || profile?.data?.[field] || user?.[field] || user?.data?.[field] || "";
  };

  const userRole = resolveField("role");

  // Dynamically filter menu items based on role
  const activeMenuItems = BASE_MENU_ITEMS.filter(item => {
    if (item.id === "roles" && userRole !== "admin") return false;
    return true;
  });

  const [formData, setFormData] = useState({
    name: resolveField("name"),
    email: resolveField("email")
  });

  useEffect(() => {
    setFormData({
      name: resolveField("name"),
      email: resolveField("email")
    });
  }, [user, profile]);

  useEffect(() => {
    setNotification(null);
  }, [activeTab]);

  const handleSave = async () => {
    setIsSaving(true);
    setNotification(null);
    try {
      const dataPayload = new FormData();
      dataPayload.append("name", formData.name);
      dataPayload.append("email", formData.email);
      
      if (avatarFile) {
        dataPayload.append("avatar", avatarFile);
      }

      const response = await api.post("/me", dataPayload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const updatedUser = response.data?.user;
      if (updatedUser?.avatar_path) {
        setAvatarUrl(`http://localhost:8000/storage/${updatedUser.avatar_path}`);
        setAvatarFile(null);
      }

      setNotification({ type: "success", message: "Profile updated successfully." });
      if (onProfileUpdate) onProfileUpdate();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Failed to save profile.";
      setNotification({ type: "error", message: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto p-6 font-sans pb-24 text-[#141414] dark:text-white">
      
      <div className="flex overflow-x-auto border-b border-gray-300 dark:border-gray-800 mb-8 custom-scrollbar hide-scrollbar">
        {activeMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "cursor-pointer flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm whitespace-nowrap transition-colors",
              activeTab === item.id 
                ? "border-[#141414] dark:border-white text-[#141414] dark:text-white" 
                : "border-transparent text-gray-400 hover:text-[#141414] dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] rounded-[2rem] border border-gray-300 dark:border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.01)] overflow-hidden">
        <div className="p-8 border-b border-gray-100 dark:border-gray-900">
          <h2 className="text-2xl font-black text-[#141414] dark:text-white">
            {activeMenuItems.find(i => i.id === activeTab)?.label}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {activeMenuItems.find(i => i.id === activeTab)?.description}
          </p>
        </div>

        {notification && (
          <div className={cn(
            "px-8 py-4 border-b text-sm font-bold flex items-center gap-2",
            notification.type === "success" 
              ? "bg-neutral-50 dark:bg-[#111111] border-gray-200 dark:border-gray-800 text-emerald-600 dark:text-emerald-400" 
              : "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400"
          )}>
            {notification.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="p-8">
          {activeTab === "profile" && (
            <ProfileSettings 
              avatarUrl={avatarUrl} 
              setAvatarUrl={setAvatarUrl} 
              setAvatarFile={setAvatarFile} 
              formData={formData} 
              setFormData={setFormData} 
            />
          )}
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "roles" && <RolesSettings />}
          {activeTab === "security" && <SecuritySettings />}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-[#141414] border-t border-gray-100 dark:border-gray-900 flex justify-end gap-3">
          <button className="cursor-pointer px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-[#141414] dark:hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-xl text-sm font-bold hover:bg-black dark:hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;