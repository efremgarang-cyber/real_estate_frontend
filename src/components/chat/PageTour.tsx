import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PageTour = ({ id, title, desc }: { id: string, title: string, desc: string }) => {
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
          initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          className="fixed top-20 right-6 w-72 p-5 bg-black text-white rounded-2xl shadow-xl z-50"
        >
          <h3 className="font-bold text-sm mb-1">{title}</h3>
          <p className="text-[11px] text-gray-400 mb-4">{desc}</p>
          <button onClick={dismiss} className="bg-white text-black px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase">Got it</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};