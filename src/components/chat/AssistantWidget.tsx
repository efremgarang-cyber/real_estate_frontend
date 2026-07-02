import React, { useState } from 'react';
import { MessageSquare, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWindow } from '../ChatWindow';

export const AssistantWidget: React.FC<{ contextData?: any }> = ({ contextData }) => {
  const [mode, setMode] = useState<'closed' | 'peek' | 'full'>('closed');

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window / Widget Container */}
      <AnimatePresence>
        {mode !== 'closed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: mode === 'full' ? '600px' : '400px',
              height: mode === 'full' ? '80vh' : '500px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
          >
            {/* Header matching your ChatWindow style */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1A1A1A]">
              <h3 className="font-bold text-sm uppercase tracking-widest text-gray-800 dark:text-gray-200">
                Makao AI Assistant
              </h3>
              <div className="flex gap-2 text-gray-500">
                <button 
                  onClick={() => setMode(mode === 'full' ? 'peek' : 'full')} 
                  className="hover:text-black dark:hover:text-white"
                >
                  {mode === 'full' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button 
                  onClick={() => setMode('closed')} 
                  className="hover:text-red-500"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <ChatWindow />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setMode(mode === 'closed' ? 'peek' : 'closed')}
        className="bg-[#141414] text-white p-4 rounded-full shadow-lg hover:bg-black transition-colors"
      >
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
};