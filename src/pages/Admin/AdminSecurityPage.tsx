import React from "react";

export const AdminSecurityPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-xl font-bold text-[#141414]">System Security</h1>
        <p className="text-gray-500 mt-2">
          Monitor system access, audit logs, and security protocols.
        </p>
      </div>
      
      {/* Add your security dashboard content here */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Active Sessions</h3>
          {/* Add session list component */}
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Audit Logs</h3>
          {/* Add audit log component */}
        </div>
      </div>
    </div>
  );
};