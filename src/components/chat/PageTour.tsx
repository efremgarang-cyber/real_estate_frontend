import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';

export const PageTour = ({
  id,
  title,
  desc,
}: {
  id: string;
  title: string;
  desc: string;
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(`tour_${id}`);
    if (!hasSeen) setShow(true);
  }, [id]);

  const dismiss = () => {
    localStorage.setItem(`tour_${id}`, 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="fixed top-20 right-6 w-72 z-50 bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden font-sans"
        >
          {/* Gold accent bar */}
          <div className="h-1 bg-[#C9A96E] w-full" />

          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#141414] flex items-center justify-center shrink-0">
                  <Sparkles size={13} className="text-[#C9A96E]" />
                </div>
                <h3 className="text-sm font-bold text-[#141414] leading-tight">{title}</h3>
              </div>
              <button
                onClick={dismiss}
                className="text-gray-400 hover:text-[#141414] transition-colors shrink-0 mt-0.5"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mb-4">{desc}</p>

            <button
              onClick={dismiss}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#141414] hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};