import React, { useState, useEffect, useRef } from "react";
import { 
  User as UserIcon, Lock, Save, Loader2, Users, 
  ShieldCheck, Bell, CreditCard, Palette, 
  Trash2, Plus, AlertCircle, Moon, Sun, Monitor, Shield, CheckCircle2
} from "lucide-react";
import { cn } from "../lib/utils";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

// ── 1. THE WRAPPER (This is what the Router loads) ──
export const Settings = () => {
  const { user, profile } = useAuth();

  // Prevent rendering until the context has hydrated
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

  return (
    <SettingsUI 
      user={user} 
      profile={profile} 
    />
  );
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

const MENU_ITEMS: SettingsSection[] = [
  { id: "profile", label: "Profile", icon: <UserIcon size={16} />, description: "Manage your personal information" },
  { id: "appearance", label: "Appearance", icon: <Palette size={16} />, description: "Customize your workspace UI" },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} />, description: "Configure alerts and digests" },
  { id: "team", label: "Team Members", icon: <Users size={16} />, description: "Invite and manage team access" },
  { id: "roles", label: "Roles & Permissions", icon: <ShieldCheck size={16} />, description: "Configure access control levels" },
  { id: "billing", label: "Billing", icon: <CreditCard size={16} />, description: "Subscription and payment history" },
  { id: "security", label: "Security", icon: <Lock size={16} />, description: "2FA and active session management" },
];

const SettingsUI: React.FC<SettingsProps> = ({ user, profile, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("theme") as "light" | "dark" | "system") || "light";
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_path ? `http://localhost:8000/storage/${user.avatar_path}` : null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Status Notification Banner State
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resolveField = (field: "name" | "email"): string => {
    return profile?.[field] || profile?.data?.[field] || user?.[field] || user?.data?.[field] || "";
  };

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
    const root = window.document.documentElement;
    localStorage.setItem("theme", theme);

    const applyTheme = (currentTheme: "light" | "dark") => {
      if (currentTheme === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    };

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      applyTheme(systemTheme);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  // Clear top-level notifications whenever tab selection shifts
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

    // Persist the returned avatar path so it survives refresh
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
        {MENU_ITEMS.map((item) => (
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
            {MENU_ITEMS.find(i => i.id === activeTab)?.label}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {MENU_ITEMS.find(i => i.id === activeTab)?.description}
          </p>
        </div>

        {/* Flat Global Notification Banner Area */}
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
          {activeTab === "appearance" && <AppearanceSettings theme={theme} setTheme={setTheme} />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "team" && <TeamSettings />}
          {activeTab === "roles" && <RolesSettings />}
          {activeTab === "billing" && <BillingSettings />}
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

// ── 3. SUBCOMPONENTS ──

interface ProfileSettingsProps {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  setAvatarFile: (file: File | null) => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ avatarUrl, setAvatarUrl, setAvatarFile, formData, setFormData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("File size exceeds 2MB limit.");
      setAvatarUrl(URL.createObjectURL(file));
      setAvatarFile(file);
    }
  };

  const userInitials = formData.name
    ? formData.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "ME";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6 pb-6 border-b border-gray-50 dark:border-gray-900">
        <div className="w-24 h-24 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-full flex items-center justify-center overflow-hidden shrink-0 font-bold text-2xl">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{userInitials}</span>
          )}
        </div>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="cursor-pointer px-4 py-2 bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 text-[#141414] dark:text-white rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors">
            Change Avatar
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">JPG, GIF or PNG. Max size 2MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="fullName" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Full Name</label>
          <input id="fullName" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-[#141414] dark:text-white px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm font-medium" />
        </div>
        <div>
          <label htmlFor="emailAddr" className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Email Address</label>
          <input id="emailAddr" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full text-[#141414] dark:text-white px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm font-medium" />
        </div>
      </div>
    </div>
  );
};

const TeamSettings = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Section-specific inline status handler 
  const [inlineNotice, setInlineNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const res = await agentApi.getAll();
      setAgents(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error("Failed to fetch agency team listings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || isSubmitting) return;

    setIsSubmitting(true);
    setInlineNotice(null);
    try {
      const autoPassword = Math.random().toString(36).slice(-10);
      await agentApi.create({
        name: inviteName,
        email: inviteEmail,
        password: autoPassword
      });
      setInviteEmail("");
      setInviteName("");
      setInlineNotice({ type: "success", message: "Agent credentials provisioned securely." });
      fetchTeam();
    } catch (err: any) {
      console.error("Team registration request rejected:", err);
      const errMsg = err?.response?.data?.message || "Failed to finalize operator invitation.";
      setInlineNotice({ type: "error", message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (id: number | string, currentName: string, newRole: string) => {
    setInlineNotice(null);
    try {
      await agentApi.update(id, { name: currentName, role: newRole.toLowerCase() });
      setInlineNotice({ type: "success", message: "Authority authorization policy updated." });
      fetchTeam();
    } catch (err) {
      console.error("Failed to modify agent scope privileges:", err);
      setInlineNotice({ type: "error", message: "Failed to sync authority adjustments." });
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Permanently revoke workspace permissions for this operator?")) return;
    setInlineNotice(null);
    try {
      await agentApi.delete(id);
      setInlineNotice({ type: "success", message: "Workspace clearance credentials completely revoked." });
      fetchTeam();
    } catch (err) {
      console.error("Revocation sequence rejected:", err);
      setInlineNotice({ type: "error", message: "Failed to execute structural team ejection." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-400">
        <Loader2 size={16} className="animate-spin" /> Fetching team register...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Local Inline Section Notification Layout */}
      {inlineNotice && (
        <p className={cn(
          "text-xs font-bold uppercase tracking-wider",
          inlineNotice.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        )}>
          {inlineNotice.message}
        </p>
      )}

      <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
        <input required type="text" placeholder="Agent Name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="px-4 py-2.5 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#0A0A0A] focus:ring-1 focus:ring-gray-400 text-sm text-[#141414] dark:text-white" />
        <input required type="email" placeholder="Email address..." value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#0A0A0A] focus:ring-1 focus:ring-gray-400 text-sm text-[#141414] dark:text-white" />
        <button type="submit" disabled={isSubmitting} className="cursor-pointer px-5 py-2.5 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-xl text-sm font-bold hover:bg-black dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Provision
        </button>
      </form>

      <div className="space-y-4">
        {agents.map((member: any) => {
          const initials = member.name?.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase() || "AG";
          return (
            <div key={member.id} className="flex items-center justify-between pb-4 border-b border-gray-50 dark:border-gray-900 last:border-0 last:pb-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-[#141414] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xs">
                  {initials}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#141414] dark:text-white">{member.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Active</span>
                <select title="Assign Security Level" value={member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : "Agent"} onChange={(e) => handleRoleChange(member.id, member.name, e.target.value)} className="cursor-pointer text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-800 rounded-lg px-2 py-1.5 bg-white dark:bg-[#0A0A0A] focus:outline-none">
                  <option value="Agent">Agent</option>
                  <option value="Admin">Admin</option>
                </select>
                <button onClick={() => handleDelete(member.id)} aria-label="Revoke Privileges" className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AppearanceSettings = ({ theme, setTheme }: { theme: string; setTheme: (t: any) => void }) => (
  <div className="space-y-8">
    <div>
      <h3 className="text-sm font-bold text-[#141414] dark:text-white mb-3">Theme Preference</h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { id: "light", icon: <Sun size={20} />, label: "Light" },
          { id: "dark", icon: <Moon size={20} />, label: "Dark" },
          { id: "system", icon: <Monitor size={20} />, label: "System" },
        ].map((option) => (
          <button key={option.id} onClick={() => setTheme(option.id as any)} className={cn("cursor-pointer p-4 border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-2", theme === option.id ? "border-[#141414] dark:border-white bg-gray-50 dark:bg-[#141414] text-[#141414] dark:text-white" : "border-gray-100 dark:border-gray-900 text-gray-400 hover:border-gray-300 dark:hover:border-gray-800 hover:text-[#141414] dark:hover:text-white")}>
            {option.icon}
            <span className="text-xs font-bold uppercase tracking-wider">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
    <div>
      <h3 className="text-sm font-bold text-[#141414] dark:text-white mb-3">Accent Color</h3>
      <div className="flex gap-3">
        {["#141414", "#3B82F6", "#EF4444", "#10B981", "#F59E0B"].map((color) => (
          <button key={color} title={`Select ${color}`} className="cursor-pointer w-10 h-10 rounded-full border-2 border-white dark:border-[#0A0A0A] shadow-sm transition-transform hover:scale-110" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  </div>
);

const NotificationSettings = () => (
  <div className="space-y-6">
    {[
      { label: "Email notifications", desc: "Receive updates via email", enabled: true },
      { label: "Push notifications", desc: "Browser push notifications", enabled: false },
      { label: "Slack integration", desc: "Get alerts in Slack", enabled: true },
      { label: "Weekly digest", desc: "Summary of weekly activity", enabled: false },
    ].map((item, i) => (
      <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-50 dark:border-gray-900 last:border-0 last:pb-0">
        <div>
          <p className="font-bold text-[#141414] dark:text-white text-sm">{item.label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
        </div>
        <input title={item.label} type="checkbox" defaultChecked={item.enabled} className="w-4 h-4 accent-[#141414] dark:accent-white" />
      </div>
    ))}
  </div>
);

const RolesSettings = () => (
  <div className="space-y-6">
    {[
      { role: "Administrator", permissions: "Full access to all features", members: 2, iconColor: "text-red-500" },
      { role: "Member", permissions: "Create and edit content", members: 5, iconColor: "text-blue-500" },
      { role: "Viewer", permissions: "Read-only access", members: 3, iconColor: "text-green-500" },
    ].map((role) => (
      <div key={role.role} className="flex justify-between items-center pb-4 border-b border-gray-50 dark:border-gray-900 last:border-0 last:pb-0">
        <div className="flex items-center gap-4">
          <Shield size={20} className={role.iconColor} />
          <div>
            <p className="font-bold text-sm text-[#141414] dark:text-white">{role.role}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{role.permissions}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs font-bold text-gray-400">{role.members} members</span>
          <button className="cursor-pointer text-xs font-bold text-[#141414] dark:text-white hover:underline">Edit</button>
        </div>
      </div>
    ))}
  </div>
);

const BillingSettings = () => (
  <div className="space-y-8">
    <div className="p-8 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-2xl flex justify-between items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Current Plan</p>
        <h3 className="text-4xl font-black mt-1">Agency Pro</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Ksh 4,500/month • Billed annually</p>
      </div>
      <button className="cursor-pointer bg-white dark:bg-[#141414] text-[#141414] dark:text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors">Upgrade Plan</button>
    </div>
    <div>
      <h3 className="text-sm font-bold text-[#141414] dark:text-white mb-4">Payment Methods</h3>
      <div className="flex justify-between items-center p-4 border border-gray-300 dark:border-gray-800 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-gray-100 dark:bg-[#141414] rounded flex items-center justify-center">
            <CreditCard size={16} className="text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#141414] dark:text-white">Visa ending in 4242</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Expires 12/2025</p>
          </div>
        </div>
        <button className="cursor-pointer text-xs font-bold text-[#141414] dark:text-white hover:underline">Edit</button>
      </div>
    </div>
    <div>
      <h3 className="text-sm font-bold text-[#141414] dark:text-white mb-4">Invoice History</h3>
      <div className="space-y-3">
        {["March 2024", "February 2024", "January 2024"].map((month) => (
          <div key={month} className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-gray-900 last:border-0 last:pb-0">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{month}</span>
            <button className="cursor-pointer text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Download PDF</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SecuritySettings = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center pb-6 border-b border-gray-100 dark:border-gray-900">
      <div>
        <p className="font-bold text-sm text-[#141414] dark:text-white">Two-Factor Authentication</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add an extra layer of security</p>
      </div>
      <button className="cursor-pointer px-4 py-2 bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 text-[#141414] dark:text-white rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors">Enable 2FA</button>
    </div>
    <div className="flex justify-between items-center pb-6 border-b border-gray-100 dark:border-gray-900">
      <div>
        <p className="font-bold text-sm text-[#141414] dark:text-white">Session Management</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active sessions: Chrome on Mac, Safari on iPhone</p>
      </div>
      <button className="cursor-pointer text-xs font-bold text-red-500 hover:underline">Logout All</button>
    </div>
    <div className="flex justify-between items-center">
      <div>
        <p className="font-bold text-sm text-[#141414] dark:text-white">API Keys</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Generate API keys for programmatic access</p>
      </div>
      <button className="cursor-pointer px-4 py-2 bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 text-[#141414] dark:text-white rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors">Generate Key</button>
    </div>
    <div className="pt-6">
      <div className="border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/10 p-5 rounded-xl flex items-start gap-3">
        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-red-700 dark:text-red-400">Danger Zone</p>
          <p className="text-xs font-medium text-red-600 dark:text-red-500 mt-1">Permanently delete your account and all associated data.</p>
          <button className="cursor-pointer mt-3 text-xs font-bold text-red-700 dark:text-red-400 hover:underline">Delete Account</button>
        </div>
      </div>
    </div>
  </div>
);

const agentApi = {
  getAll: async () => (await api.get('/v1/agents')).data,
  create: async (p: any) => (await api.post('/v1/agents', p)).data,
  update: async (id: any, p: any) => (await api.put(`/v1/agents/${id}`, p)).data,
  delete: async (id: any) => await api.delete(`/v1/agents/${id}`)
};