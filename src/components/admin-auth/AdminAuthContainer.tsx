import React from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";

interface AdminAuthContainerProps {
  children: React.ReactNode;
  onBack?: () => void;
}

export const AdminAuthContainer: React.FC<AdminAuthContainerProps> = ({ children, onBack }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-6 font-sans">
    <div className="max-w-md w-full p-10 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
      <div className="flex flex-col items-center justify-center mb-6 relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#141414] transition-colors p-2 -ml-2"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center shadow-md">
           <ShieldCheck size={28} className="text-white" />
        </div>
      </div>
      {children}
    </div>
  </div>
);