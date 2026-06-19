
import React, { useEffect, useState} from "react";

const ActiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/sessions', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('makao_token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setSessions(data);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-xs text-gray-400 animate-pulse">Loading sessions...</p>
      ) : sessions.length > 0 ? (
        sessions.map((session: any) => (
          <div key={session.id} className="flex justify-between items-center text-sm border-b pb-2 dark:border-gray-800">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{session.user_name}</p>
              <p className="text-xs text-gray-400">{session.ip_address} • {session.browser}</p>
            </div>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span>
          </div>
        ))
      ) : (
        <p className="text-xs text-gray-500">No active sessions found.</p>
      )}
    </div>
  );
};
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
    <div className="space-y-6">
      {/* ... Header remains same ... */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#141414] p-6 rounded-2xl border border-neutral-200/60 dark:border-gray-800 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Active Sessions</h3>
          <ActiveSessions />
        </div>
        <div className="bg-white dark:bg-[#141414] p-6 rounded-2xl border border-neutral-200/60 dark:border-gray-800 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Audit Logs</h3>
          <AuditLogs />
        </div>
      </div>
    </div>
  );
};


