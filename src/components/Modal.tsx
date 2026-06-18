import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full m-4 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
        >
          ✕
        </button>
        <div className="max-h-[85vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};