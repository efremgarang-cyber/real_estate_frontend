import React, { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "System update: Security patch 2.4", time: "5m ago", read: false },
    { id: 2, text: "New user registration request", time: "1h ago", read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close when clicking outside */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.length > 0 ? notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-xl text-sm transition-colors ${n.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                    <p className={`font-medium ${n.read ? 'text-gray-600' : 'text-blue-900'}`}>{n.text}</p>
                    <span className="text-xs text-gray-400 mt-1 block">{n.time}</span>
                  </div>
                )) : <p className="text-center text-gray-400 py-4">No new notifications</p>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};