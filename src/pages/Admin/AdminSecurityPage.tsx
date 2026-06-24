import React, { useEffect, useState } from "react";

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/logs', { 
      headers: { 'Authorization': `Bearer ${localStorage.getItem('makao_token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setLogs(data);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-xs text-gray-400 animate-pulse">Loading logs...</p>
      ) : logs.length > 0 ? (
        logs.map((log: any) => (
          <div key={log.id} className="text-xs p-3 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg border dark:border-gray-800">
            <span className="font-bold text-indigo-500">{log.user_name}</span> 
            <span className="text-gray-500"> {log.action}</span>
            <p className="text-[10px] text-gray-400 mt-1">{new Date(log.created_at).toLocaleString()}</p>
          </div>
        ))
      ) : (
        <p className="text-xs text-gray-500">No recent logs found.</p>
      )}
    </div>
  );
};

export const AdminSecurityPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white dark:bg-[#141414] p-6 rounded-2xl border border-neutral-200/60 dark:border-gray-800 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">System Activity Logs</h3>
        <AuditLogs />
      </div>
    </div>
  );
};