import React, { useState } from 'react';
import { X, Maximize2, Minimize2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatWindow } from '../ChatWindow';

export const AssistantWidget: React.FC<{ contextData?: any }> = ({ contextData }) => {
  const [mode, setMode] = useState<'closed' | 'peek' | 'full'>('closed');

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">

      {/* Chat panel */}
      <AnimatePresence>
        {mode !== 'closed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              width:  mode === 'full' ? 560 : 400,
              height: mode === 'full' ? '80vh' : 520,
            }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="mb-4 overflow-hidden flex flex-col rounded-[2rem] border border-gray-100 shadow-[0_24px_64px_rgba(0,0,0,0.12)]"
          >
            {/* Widget header — sits above ChatWindow's own header */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#141414] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                  <Bot size={13} className="text-[#C9A96E]" />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                  Makao Assistant
                </span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode(mode === 'full' ? 'peek' : 'full')}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label={mode === 'full' ? 'Minimize' : 'Expand'}
                >
                  {mode === 'full'
                    ? <Minimize2 size={13} className="text-white/70" />
                    : <Maximize2 size={13} className="text-white/70" />
                  }
                </button>
                <button
                  onClick={() => setMode('closed')}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X size={13} className="text-white/70" />
                </button>
              </div>
            </div>

            {/* Chat content — fills remaining height */}
            <div className="flex-1 overflow-hidden">
              <ChatWindow />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB toggle button */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setMode(mode === 'closed' ? 'peek' : 'closed')}
        className="relative w-14 h-14 bg-[#141414] hover:bg-black rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.25)] flex items-center justify-center transition-colors"
        aria-label="Open Makao Assistant"
      >
        <Bot size={22} className="text-[#C9A96E]" />
        {/* Gold ring pulse when closed */}
        {mode === 'closed' && (
          <span className="absolute inset-0 rounded-full border border-[#C9A96E]/30 animate-ping" />
        )}
      </motion.button>
    </div>
  );
};