// src/components/admin-auth/AdminLoginView.tsx
import React, { useState } from "react";
import { useAuth } from "@/src/lib/AuthContext";
import { ArrowRight, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export type AdminAuthView = 'login' | 'signup' | 'agency_setup' | 'otp_login';

interface AdminLoginViewProps {
  onSwitchView: (view: AdminAuthView) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onSwitchView }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); 
    setError(null);
    try {
      const result = await login(email, password, remember);

      // ── CATCH THE 2FA INTERCEPT ──
      if (result?.requires2FA) {
        onSwitchView('otp_login'); 
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Authentication failed. Check your admin credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">Welcome Back</h1>
      <p className="text-sm text-center text-gray-500 mb-8">Sign in to access high-clearance dashboard systems.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
          <input
            type="email" required placeholder="admin@company.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414] placeholder-gray-400 font-medium"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <button type="button" className="text-[10px] font-bold text-[#C5A880] hover:text-[#141414] transition-colors uppercase tracking-wider">
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} required placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all pr-12 text-sm text-[#141414] placeholder-gray-400 font-medium"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#141414]">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center pt-1">
          <input 
            type="checkbox" 
            id="remember" 
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#141414] focus:ring-[#141414] cursor-pointer" 
          />
          <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer">
            Remember me
          </label>
        </div>

        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-black/10">
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
          {!isLoading && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="mt-8 text-center">
        <span className="text-sm text-gray-500">Need a brand new workspace?</span>
        <button type="button" onClick={() => onSwitchView('signup')} className="ml-1 text-sm font-bold text-[#141414] hover:text-[#C5A880] transition-colors">
          Register Agency
        </button>
      </div>
    </div>
  );
};