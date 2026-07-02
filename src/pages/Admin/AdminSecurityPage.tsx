// src/pages/Admin/security/AdminSecurityPage.tsx
import React from "react";

export const AdminSecurityPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#141414] p-6 rounded-2xl border border-neutral-200/60 dark:border-gray-800 shadow-sm">
        <h1 className="text-xl font-bold text-[#141414] dark:text-white">System Security</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Monitor system access, audit logs, and security protocols.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#141414] p-6 rounded-2xl border border-neutral-200/60 dark:border-gray-800 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Active Sessions</h3>
          {/* Add session list component */}
        </div>
        <div className="bg-white dark:bg-[#141414] p-6 rounded-2xl border border-neutral-200/60 dark:border-gray-800 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Audit Logs</h3>
          {/* Add audit log component */}
        </div>
      </div>
    </div>
  );
};