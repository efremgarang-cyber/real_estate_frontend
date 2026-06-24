import React, { useRef } from "react";

interface ProfileSettingsProps {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  setAvatarFile: (file: File | null) => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  avatarUrl, 
  setAvatarUrl, 
  setAvatarFile, 
  formData, 
  setFormData 
}) => {
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

  // Formats relative paths to hit the Laravel backend, while preserving blob/http links
  const getDisplayUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    
    // Fallback to localhost:8000 for relative Laravel paths
    const backendUrl = "http://localhost:8000";
    return url.startsWith("/") ? `${backendUrl}${url}` : `${backendUrl}/storage/${url}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6 pb-6 border-b border-gray-50 dark:border-gray-900">
        <div className="w-24 h-24 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-full flex items-center justify-center overflow-hidden shrink-0 font-bold text-2xl">
          {avatarUrl ? (
            <img src={getDisplayUrl(avatarUrl) as string} alt="Avatar" className="w-full h-full object-cover" />
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