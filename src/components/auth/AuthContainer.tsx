import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthContainerProps {
  children: React.ReactNode;
  onBack?: () => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({ children, onBack }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-6 font-sans">
    <div className="max-w-md w-full p-10 border border-gray-300 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
      <div className="flex flex-col items-center justify-center mb-8 relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#141414] transition-colors p-2 -ml-2"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="w-16 h-16 bg-[#141414] rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-black/10">
          <Link to={"/"}>
            <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-8 h-8 object-contain" />
          </Link>
        </div>
      </div>
      {children}
    </div>
  </div>
);