import React, { useState, useEffect } from 'react';
import { Bell, Check, Loader2, Inbox, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

interface BackendLog {
  id: number;
  action: string;
  description: string | null;
  created_at: string;
  user_name: string | null;
}

interface NotificationItem {
  id: number;
  text: string;
  time: string;
  read: boolean;
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [readIds, setReadIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('read_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const formatRelativeTime = (dateString: string): string => {
    if (!dateString) return 'Just now';
    const now = new Date();
    const past = new Date(dateString.replace(' ', 'T'));
    const elapsed = now.getTime() - past.getTime();

    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;

    if (elapsed < msPerMinute) return 'Just now';
    if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + 'm ago';
    if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + 'h ago';
    return Math.round(elapsed / msPerDay) + 'd ago';
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('makao_token'); 
      const response = await axios.get<BackendLog[]>('http://127.0.0.1:8000/api/v1/admin/logs', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        }
      });
      
      const mappedLogs: NotificationItem[] = response.data.map((log) => ({
        id: log.id,
        text: log.description || `${log.user_name || 'System'} performed ${log.action}`,
        time: formatRelativeTime(log.created_at),
        read: readIds.includes(log.id),
      }));

      setNotifications(mappedLogs);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const livePolling = setInterval(fetchNotifications, 30000);
    return () => clearInterval(livePolling);
  }, [readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updatedReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updatedReadIds);
    localStorage.setItem('read_notifications', JSON.stringify(updatedReadIds));
  };

  const markSingleRead = (id: number) => {
    if (readIds.includes(id)) return;
    const updatedReadIds = [...readIds, id];
    setReadIds(updatedReadIds);
    localStorage.setItem('read_notifications', JSON.stringify(updatedReadIds));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors uppercase tracking-wider">
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="flex flex-col justify-center items-center py-10 text-slate-400 gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-xs">Updating stream...</span>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => markSingleRead(n.id)}
                      className={`group p-3 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
                        n.read ? 'hover:bg-slate-50 dark:hover:bg-slate-800' : 'bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50'
                      }`}
                    >
                      <p className={`text-xs leading-relaxed ${n.read ? 'text-slate-500 font-normal' : 'text-slate-900 dark:text-slate-200 font-semibold'}`}>
                        {n.text}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400">
                        <Clock size={10} /> {n.time}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                    <Inbox size={24} className="mb-2 opacity-50" />
                    <p className="text-xs">No activity found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};