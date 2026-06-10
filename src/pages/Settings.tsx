import React, { useState } from "react";
import { 
  User, Lock, Save, Loader2, Users, 
  ShieldCheck, Bell, CreditCard, Palette, 
  Trash2, Plus, AlertCircle, Moon, Sun, Monitor, Shield
} from "lucide-react";
import { cn } from "../lib/utils";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const MENU_ITEMS: SettingsSection[] = [
  { id: "profile", label: "Profile", icon: <User size={16} />, description: "Manage your personal information" },
  { id: "appearance", label: "Appearance", icon: <Palette size={16} />, description: "Customize your workspace UI" },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} />, description: "Configure alerts and digests" },
  { id: "team", label: "Team Members", icon: <Users size={16} />, description: "Invite and manage team access" },
  { id: "roles", label: "Roles & Permissions", icon: <ShieldCheck size={16} />, description: "Configure access control levels" },
  { id: "billing", label: "Billing", icon: <CreditCard size={16} />, description: "Subscription and payment history" },
  { id: "security", label: "Security", icon: <Lock size={16} />, description: "2FA and active session management" },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile": return <ProfileSettings />;
      case "appearance": return <AppearanceSettings theme={theme} setTheme={setTheme} />;
      case "notifications": return <NotificationSettings />;
      case "team": return <TeamSettings />;
      case "roles": return <RolesSettings />;
      case "billing": return <BillingSettings />;
      case "security": return <SecuritySettings />;
      default: return null;
    }
  };

  return (
    <div className="mx-auto p-6 font-sans pb-24">

      {/* Compact Horizontal Navigation */}
      <div className="flex overflow-x-auto border-b border-gray-300 mb-8 custom-scrollbar hide-scrollbar">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-sm whitespace-nowrap transition-colors",
              activeTab === item.id 
                ? "border-[#141414] text-[#141414]" 
                : "border-transparent text-gray-400 hover:text-[#141414] hover:border-gray-300"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-black text-[#141414]">
            {MENU_ITEMS.find(i => i.id === activeTab)?.label}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {MENU_ITEMS.find(i => i.id === activeTab)?.description}
          </p>
        </div>

        <div className="p-8">
          {renderContent()}
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-[#141414] transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#141414] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const ProfileSettings = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
      <div className="w-24 h-24 bg-[#141414] rounded-full flex items-center justify-center">
        <span className="text-3xl font-black text-white">JD</span>
      </div>
      <div>
        <button className="px-4 py-2 bg-white border border-gray-300 text-[#141414] rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
          Change Avatar
        </button>
        <p className="text-xs text-gray-400 mt-2 font-medium">JPG, GIF or PNG. Max size 2MB</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
        <input type="text" defaultValue="John Doe" className="w-full text-gray-400
text-gray-700 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#141414] text-sm font-medium" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
        <input type="email" defaultValue="john@workspace.com" className="w-full text-gray-400
text-gray-700 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#141414] text-sm font-medium" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone Number</label>
        <input type="tel" defaultValue="+254 700 000000" className="w-full text-gray-400
text-gray-700 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#141414] text-sm font-medium" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Job Title</label>
        <input type="text" defaultValue="Real Estate Agent" className="w-full text-gray-400
text-gray-700 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#141414] text-sm font-medium" />
      </div>
    </div>

    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bio</label>
      <textarea rows={3} className="w-full text-gray-400
text-gray-700 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#141414] text-sm font-medium resize-none" placeholder="Tell us about yourself..."></textarea>
    </div>
  </div>
);

const AppearanceSettings = ({ theme, setTheme }: { theme: string; setTheme: (t: any) => void }) => (
  <div className="space-y-8">
    <div>
      <h3 className="text-sm font-bold text-[#141414] mb-3">Theme Preference</h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { id: "light", icon: <Sun size={20} />, label: "Light" },
          { id: "dark", icon: <Moon size={20} />, label: "Dark" },
          { id: "system", icon: <Monitor size={20} />, label: "System" },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id as any)}
            className={cn(
              "p-4 border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-2",
              theme === option.id 
                ? "border-[#141414] bg-gray-50 text-[#141414]" 
                : "border-gray-100 text-gray-400 hover:border-gray-300 hover:text-[#141414]"
            )}
          >
            {option.icon}
            <span className="text-xs font-bold uppercase tracking-wider">{option.label}</span>
          </button>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-sm font-bold text-[#141414] mb-3">Accent Color</h3>
      <div className="flex gap-3">
        {["#141414", "#3B82F6", "#EF4444", "#10B981", "#F59E0B"].map((color) => (
          <button
            key={color}
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
            style={{ backgroundColor: color }}
          />
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
      <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
        <div>
          <p className="font-bold text-[#141414] text-sm">{item.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
        </div>
        <input type="checkbox" defaultChecked={item.enabled} className="w-4 h-4 accent-[#141414]" />
      </div>
    ))}
  </div>
);

const TeamSettings = () => {
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div className="space-y-8">
      <div className="flex gap-3">
        <input 
          type="email" 
          placeholder="Enter email address..."
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#141414] text-sm"
        />
        <button className="px-5 py-2.5 bg-[#141414] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors flex items-center gap-2 shrink-0">
          <Plus size={16} /> Invite
        </button>
      </div>

      <div className="space-y-4">
        {[
          { name: "Alice Chen", role: "Admin", email: "alice@workspace.com", status: "active" },
          { name: "David Miller", role: "Member", email: "david@workspace.com", status: "active" },
          { name: "Sarah Johnson", role: "Viewer", email: "sarah@workspace.com", status: "pending" },
        ].map((member) => (
          <div key={member.name} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                <User size={16} />
              </div>
              <div>
                <p className="font-bold text-sm text-[#141414]">{member.name}</p>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Plain text status formatting - NO backgrounds */}
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                member.status === "active" ? "text-green-600" : "text-orange-500"
              )}>
                {member.status}
              </span>
              
              <select className="text-xs font-bold text-gray-700 border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
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

const RolesSettings = () => (
  <div className="space-y-6">
    {[
      { role: "Administrator", permissions: "Full access to all features", members: 2, iconColor: "text-red-500" },
      { role: "Member", permissions: "Create and edit content", members: 5, iconColor: "text-blue-500" },
      { role: "Viewer", permissions: "Read-only access", members: 3, iconColor: "text-green-500" },
    ].map((role) => (
      <div key={role.role} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
        <div className="flex items-center gap-4">
          {/* Plain Icon - No colored backgrounds */}
          <Shield size={20} className={role.iconColor} />
          <div>
            <p className="font-bold text-sm text-[#141414]">{role.role}</p>
            <p className="text-xs text-gray-500 mt-0.5">{role.permissions}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs font-bold text-gray-400">{role.members} members</span>
          <button className="text-xs font-bold text-[#141414] hover:underline">Edit</button>
        </div>
      </div>
    ))}
  </div>
);

const BillingSettings = () => (
  <div className="space-y-8">
    <div className="p-8 bg-[#141414] rounded-2xl text-white flex justify-between items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Current Plan</p>
        <h3 className="text-4xl font-black mt-1">Agency Pro</h3>
        <p className="text-sm text-gray-400 mt-2">Ksh 4,500/month • Billed annually</p>
      </div>
      <button className="bg-white text-[#141414] px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors">
        Upgrade Plan
      </button>
    </div>

    <div>
      <h3 className="text-sm font-bold text-[#141414] mb-4">Payment Methods</h3>
      <div className="flex justify-between items-center p-4 border border-gray-300 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
            <CreditCard size={16} className="text-gray-500" />
          </div>
          <div>
            <p className="font-bold text-sm text-[#141414]">Visa ending in 4242</p>
            <p className="text-xs text-gray-500 mt-0.5">Expires 12/2025</p>
          </div>
        </div>
        <button className="text-xs font-bold text-[#141414] hover:underline">Edit</button>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-bold text-[#141414] mb-4">Invoice History</h3>
      <div className="space-y-3">
        {["March 2024", "February 2024", "January 2024"].map((month) => (
          <div key={month} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 last:pb-0">
            <span className="text-sm font-bold text-gray-600">{month}</span>
            <button className="text-xs font-bold text-blue-600 hover:underline">Download PDF</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SecuritySettings = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center pb-6 border-b border-gray-100">
      <div>
        <p className="font-bold text-sm text-[#141414]">Two-Factor Authentication</p>
        <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security</p>
      </div>
      <button className="px-4 py-2 bg-white border border-gray-300 text-[#141414] rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">
        Enable 2FA
      </button>
    </div>

    <div className="flex justify-between items-center pb-6 border-b border-gray-100">
      <div>
        <p className="font-bold text-sm text-[#141414]">Session Management</p>
        <p className="text-xs text-gray-500 mt-0.5">Active sessions: Chrome on Mac, Safari on iPhone</p>
      </div>
      <button className="text-xs font-bold text-red-500 hover:underline">Logout All</button>
    </div>

    <div className="flex justify-between items-center">
      <div>
        <p className="font-bold text-sm text-[#141414]">API Keys</p>
        <p className="text-xs text-gray-500 mt-0.5">Generate API keys for programmatic access</p>
      </div>
      <button className="px-4 py-2 bg-white border border-gray-300 text-[#141414] rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">
        Generate Key
      </button>
    </div>

    <div className="pt-6">
      <div className="border border-red-200 bg-red-50 p-5 rounded-xl flex items-start gap-3">
        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-red-700">Danger Zone</p>
          <p className="text-xs font-medium text-red-600 mt-1">Permanently delete your account and all associated data.</p>
          <button className="mt-3 text-xs font-bold text-red-700 hover:underline">Delete Account</button>
        </div>
      </div>
    </div>
  </div>
);