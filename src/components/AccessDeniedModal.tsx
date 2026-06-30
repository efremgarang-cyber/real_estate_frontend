import React from "react";
import { Lock } from "lucide-react";
import { motion } from "motion/react";

export const AccessDeniedModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center"
    >
      <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4">
        <Lock className="text-rose-500" size={24} />
      </div>
      <h3 className="text-lg font-bold text-neutral-900">Access Denied</h3>
      <p className="text-neutral-500 mt-2 mb-6 text-sm">
        This deal is finalized and cannot be moved without administrative authorization.
      </p>
      <button 
        onClick={onClose}
        className="w-full py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800"
      >
        Dismiss
      </button>
    </motion.div>
  </div>
);