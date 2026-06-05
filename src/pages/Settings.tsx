import React, { useState } from "react";
import { 
  User, Building2, Lock, Save, Loader2, Users, Briefcase, 
  ShieldCheck, Bell, CreditCard, ChevronRight, Globe, 
  Palette, Key, Mail, Phone, Trash2, Plus, Check, 
  AlertCircle, Moon, Sun, Monitor 
} from "lucide-react";
import { cn } from "../lib/utils";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const MENU_ITEMS: SettingsSection[] = [
  { id: "profile", label: "Profile", icon: <User size={18} />, description: "Manage your personal information" },
  { id: "appearance", label: "Appearance", icon: <Palette size={18} />, description: "Customize your theme" },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} />, description: "Configure alerts" },
  { id: "team", label: "Team Members", icon: <Users size={18} />, description: "Invite and manage team" },
  { id: "roles", label: "Roles & Permissions", icon: <ShieldCheck size={18} />, description: "Access control" },
  { id: "billing", label: "Billing", icon: <CreditCard size={18} />, description: "Subscription & payments" },
  { id: "security", label: "Security", icon: <Lock size={18} />, description: "2FA & session management" },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "appearance":
        return <AppearanceSettings theme={theme} setTheme={setTheme} />;
      case "notifications":
        return <NotificationSettings />;
      case "team":
        return <TeamSettings />;
      case "roles":
        return <RolesSettings />;
      case "billing":
        return <BillingSettings />;
      case "security":
        return <SecuritySettings />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="heading-display text-5xl md:text-6xl mb-3">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg font-sans">
          Configure your workspace and account preferences
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar - Dashboard Card Style */}
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="dashboard-card !p-3">
            <div className="space-y-6">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all duration-200 group",
                    activeTab === item.id 
                      ? "bg-[#141414] dark:bg-gray-800 text-white dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className={cn(
                      "transition-colors",
                      activeTab === item.id ? "text-white" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm">{item.label}</span>
                    {activeTab === item.id && <ChevronRight size={14} className="ml-auto" />}
                  </div>
                  <p className={cn(
                    "text-xs pl-7 transition-colors",
                    activeTab === item.id 
                      ? "text-gray-300 dark:text-gray-300" 
                      : "text-gray-400 dark:text-gray-500"
                  )}>
                    {item.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="col-span-12 md:col-span-8 lg:col-span-9">
          <div className="dashboard-card !p-0 overflow-hidden">
            <div className="p-8 border-b border-[#141414] dark:border-gray-800">
              <h2 className="text-2xl font-display font-semibold capitalize">
                {MENU_ITEMS.find(i => i.id === activeTab)?.label}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {MENU_ITEMS.find(i => i.id === activeTab)?.description}
              </p>
            </div>

            <div className="p-8">
              {renderContent()}
            </div>

            {/* Action Buttons */}
            <div className="p-8 bg-gray-50 dark:bg-[#1A1A1A] border-t border-[#141414] dark:border-gray-800 flex justify-end gap-4">
              <button className="btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2 min-w-[120px] justify-center"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Profile Settings Component
const ProfileSettings = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
      <div className="w-24 h-24 bg-gradient-to-br from-[#141414] to-gray-600 rounded-full flex items-center justify-center">
        <span className="text-3xl font-display text-white">JD</span>
      </div>
      <div>
        <button className="btn-secondary text-sm">
          Change Avatar
        </button>
        <p className="text-xs text-gray-400 mt-2">JPG, GIF or PNG. Max size 2MB</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input type="text" defaultValue="John Doe" className="input-field" />
      </div>
      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input type="email" defaultValue="john@workspace.com" className="input-field" />
      </div>
      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input type="tel" defaultValue="+1 (555) 000-0000" className="input-field" />
      </div>
      <div className="form-group">
        <label className="form-label">Job Title</label>
        <input type="text" defaultValue="Product Designer" className="input-field" />
      </div>
    </div>

    <div className="form-group">
      <label className="form-label">Bio</label>
      <textarea rows={3} className="input-field resize-none" placeholder="Tell us about yourself..." />
    </div>
  </div>
);

// Appearance Settings
const AppearanceSettings = ({ theme, setTheme }: { theme: string; setTheme: (t: any) => void }) => (
  <div className="space-y-8">
    <div>
      <h3 className="font-semibold mb-3">Theme Preference</h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { id: "light", icon: <Sun size={24} />, label: "Light" },
          { id: "dark", icon: <Moon size={24} />, label: "Dark" },
          { id: "system", icon: <Monitor size={24} />, label: "System" },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id as any)}
            className={cn(
              "p-4 border-2 rounded-lg transition-all text-center",
              theme === option.id 
                ? "border-[#141414] dark:border-white bg-gray-50 dark:bg-gray-800" 
                : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
            )}
          >
            <div className="flex justify-center mb-2">{option.icon}</div>
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>

    <div>
      <h3 className="font-semibold mb-3">Accent Color</h3>
      <div className="flex gap-3">
        {["#141414", "#3B82F6", "#EF4444", "#10B981", "#F59E0B"].map((color) => (
          <button
            key={color}
            className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-md transition-transform hover:scale-110"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>

    <div className="data-row flex justify-between items-center !border-0 !px-0">
      <div>
        <p className="font-medium">Reduced Motion</p>
        <p className="text-sm text-gray-500">Minimize non-essential animations</p>
      </div>
      <input type="checkbox" className="w-5 h-5 accent-[#141414]" />
    </div>
  </div>
);

// Notification Settings
const NotificationSettings = () => (
  <div className="space-y-4">
    {[
      { label: "Email notifications", desc: "Receive updates via email", enabled: true },
      { label: "Push notifications", desc: "Browser push notifications", enabled: false },
      { label: "Slack integration", desc: "Get alerts in Slack", enabled: true },
      { label: "Weekly digest", desc: "Summary of weekly activity", enabled: false },
    ].map((item, i) => (
      <div key={i} className="data-row flex justify-between items-center !border-0 !px-0">
        <div>
          <p className="font-medium">{item.label}</p>
          <p className="text-sm text-gray-500">{item.desc}</p>
        </div>
        <input type="checkbox" defaultChecked={item.enabled} className="w-5 h-5 accent-[#141414]" />
      </div>
    ))}
  </div>
);

// Team Settings
const TeamSettings = () => {
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      <div className="bg-gray-50 dark:bg-[#1A1A1A] p-4 rounded-lg">
        <div className="flex gap-3">
          <input 
            type="email" 
            placeholder="Enter email address..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="input-field flex-1"
          />
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Invite
          </button>
        </div>
      </div>

      {/* Team List */}
      <div className="space-y-3">
        {[
          { name: "Alice Chen", role: "Admin", email: "alice@workspace.com", status: "active" },
          { name: "David Miller", role: "Member", email: "david@workspace.com", status: "active" },
          { name: "Sarah Johnson", role: "Viewer", email: "sarah@workspace.com", status: "pending" },
        ].map((member) => (
          <div key={member.name} className="data-row flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn(
                "text-xs px-2 py-1 rounded",
                member.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700"
              )}>
                {member.status}
              </span>
              <select className="text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-transparent">
                <option>{member.role}</option>
                <option>Admin</option>
                <option>Member</option>
                <option>Viewer</option>
              </select>
              <button className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Roles & Permissions
const RolesSettings = () => (
  <div className="space-y-6">
    {[
      { role: "Administrator", permissions: "Full access to all features", members: 2, color: "bg-red-100 dark:bg-red-900/30" },
      { role: "Member", permissions: "Create and edit content", members: 5, color: "bg-blue-100 dark:bg-blue-900/30" },
      { role: "Viewer", permissions: "Read-only access", members: 3, color: "bg-green-100 dark:bg-green-900/30" },
    ].map((role) => (
      <div key={role.role} className="data-row flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-lg", role.color)} />
          <div>
            <p className="font-semibold">{role.role}</p>
            <p className="text-sm text-gray-500">{role.permissions}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{role.members} members</span>
          <button className="text-sm font-medium">Edit</button>
        </div>
      </div>
    ))}
  </div>
);

// Billing Settings
const BillingSettings = () => (
  <div className="space-y-6">
    <div className="dashboard-card !p-6 bg-gradient-to-r from-[#141414] to-gray-800 text-white">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-80">Current Plan</p>
          <h3 className="text-3xl font-display font-bold mt-1">Pro Plan</h3>
          <p className="text-sm opacity-80 mt-2">$29/month • Billed annually</p>
        </div>
        <button className="bg-white text-[#141414] px-4 py-2 rounded-lg font-medium text-sm">
          Upgrade
        </button>
      </div>
    </div>

    <div>
      <h3 className="font-semibold mb-3">Payment Methods</h3>
      <div className="data-row flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CreditCard size={20} />
          <div>
            <p className="font-medium">Visa ending in 4242</p>
            <p className="text-xs text-gray-500">Expires 12/2025</p>
          </div>
        </div>
        <button className="text-sm">Edit</button>
      </div>
    </div>

    <div>
      <h3 className="font-semibold mb-3">Invoice History</h3>
      <div className="space-y-2">
        {["March 2024", "February 2024", "January 2024"].map((month) => (
          <div key={month} className="flex justify-between items-center py-2">
            <span>{month}</span>
            <button className="text-sm text-gray-500 hover:text-[#141414]">Download PDF</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Security Settings
const SecuritySettings = () => (
  <div className="space-y-6">
    <div className="data-row flex justify-between items-center">
      <div>
        <p className="font-semibold">Two-Factor Authentication</p>
        <p className="text-sm text-gray-500">Add an extra layer of security</p>
      </div>
      <button className="btn-primary text-sm">Enable 2FA</button>
    </div>

    <div className="data-row flex justify-between items-center">
      <div>
        <p className="font-semibold">Session Management</p>
        <p className="text-sm text-gray-500">Active sessions: Chrome on Mac, Safari on iPhone</p>
      </div>
      <button className="text-sm text-red-500">Logout All</button>
    </div>

    <div className="data-row flex justify-between items-center">
      <div>
        <p className="font-semibold">API Keys</p>
        <p className="text-sm text-gray-500">Generate API keys for programmatic access</p>
      </div>
      <button className="btn-secondary text-sm">Generate Key</button>
    </div>

    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Danger Zone</p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">Permanently delete your account and all data</p>
            <button className="mt-3 text-sm text-red-600 dark:text-red-400 underline">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);