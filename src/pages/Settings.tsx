import React, { useState } from "react";
import { User, Building, Lock, Save, Loader2, UploadCloud } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { agentApi } from "../api/agents";
import { agencyApi } from "../api/agency";
import { cn } from "../lib/utils";

type Tab = "profile" | "agency" | "security";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for forms
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    agencyName: "Makao Real Estate", // Replace with user?.agency?.name
    agencyLocation: "Nairobi, Kenya",
    currentPassword: "",
    newPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      if (activeTab === "profile") {
        // Send only the profile details
        await agentApi.update(user.id, {
          name: formData.name,
          email: formData.email,
        });
        alert("Profile updated successfully.");
        
      } else if (activeTab === "security") {
        // Enforce password presence and send only the password
        if (!formData.newPassword) {
          alert("Please enter a new password to update your security settings.");
          setIsSaving(false);
          return;
        }
        await agentApi.update(user.id, {
          password: formData.newPassword,
        });
        // Clear the password fields after a successful update
        setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
        alert("Password updated successfully.");
        
      } else if (activeTab === "agency") {
        if (!user.agency_id) {
          alert("Error: No agency associated with this account.");
          setIsSaving(false);
          return;
        }

        await agencyApi.update(user.agency_id, {
          name: formData.agencyName,
          location: formData.agencyLocation,
        });
        
        alert("Agency details updated successfully.");
      }

    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please ensure your email is unique and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto font-sans pb-12">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#141414]">Settings</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">
          Manage your personal profile, agency details, and security preferences.
        </p>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-100 rounded-2xl w-fit mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
            activeTab === "profile" ? "bg-white text-[#141414] shadow-sm" : "text-gray-500 hover:text-[#141414]"
          )}
        >
          <User size={16} /> Personal Profile
        </button>
        <button
          onClick={() => setActiveTab("agency")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
            activeTab === "agency" ? "bg-white text-[#141414] shadow-sm" : "text-gray-500 hover:text-[#141414]"
          )}
        >
          <Building size={16} /> Agency Details
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
            activeTab === "security" ? "bg-white text-[#141414] shadow-sm" : "text-gray-500 hover:text-[#141414]"
          )}
        >
          <Lock size={16} /> Security
        </button>
      </div>

      {/* Main Content Area */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h3 className="text-lg font-bold text-[#141414] mb-4">Profile Information</h3>
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                  <User size={32} />
                </div>
                <div>
                  <button type="button" className="flex items-center gap-2 text-sm font-bold text-[#141414] bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors mb-1">
                    <UploadCloud size={16} /> Upload Avatar
                  </button>
                  <p className="text-xs text-gray-400 font-medium mt-2">JPG, GIF or PNG. Max size of 2MB.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  name="name" type="text" value={formData.name} onChange={handleInputChange} required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-[#141414] font-medium"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  name="email" type="email" value={formData.email} onChange={handleInputChange} required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-[#141414] font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* AGENCY TAB */}
        {activeTab === "agency" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-bold text-[#141414] mb-4">Agency Details</h3>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Agency Name</label>
                <input 
                  name="agencyName" type="text" value={formData.agencyName} onChange={handleInputChange} required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-[#141414] font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Headquarters Location</label>
                <input 
                  name="agencyLocation" type="text" value={formData.agencyLocation} onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-[#141414] font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-bold text-[#141414] mb-4">Change Password</h3>
            <div className="grid grid-cols-1 gap-5 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                <input 
                  name="currentPassword" type="password" value={formData.currentPassword} onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-[#141414] font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                <input 
                  name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-[#141414] font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
          <button type="button" className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-70 shadow-sm"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
};