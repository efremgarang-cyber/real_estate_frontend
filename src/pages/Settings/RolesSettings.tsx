import React from "react";
import { Shield } from "lucide-react";

export const RolesSettings = () => (
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