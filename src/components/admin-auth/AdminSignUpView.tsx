import React, { useState } from "react";
import { useAuth } from "@/src/lib/AuthContext";
import { ArrowRight, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react";

export const AdminSignUpView: React.FC<{ onSwitchView: (view: 'login' | 'signup') => void }> = ({ onSwitchView }) => {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true); setAuthError(null);
    try {
      await register(email, password, name, "", "admin");
    } catch (error: any) {
      setAuthError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Registration failed. Please check your details and try again."
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">Admin Registration</h1>
      <p className="text-sm text-center text-gray-500 mb-8">Establish your corporate administrative account.</p>

      {authError && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-600">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        <div className="p-4 bg-gray-50 border-2 border-gray-100 rounded-xl flex items-start gap-3 mb-6">
          <ShieldCheck size={18} className="text-[#141414] shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-gray-600 leading-relaxed">
            Creating an <strong className="text-[#141414]">Agency Admin</strong> profile creates a tenant sandbox. Next, you will establish your workspace.
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
          <input
            type="text" required placeholder="e.g. Jane Doe"
            value={name} onChange={(e) => { setName(e.target.value); if (authError) setAuthError(null); }}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-colors text-sm text-[#141414] placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
          <input
            type="email" required placeholder="admin@company.com"
            value={email} onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError(null); }}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-colors text-sm text-[#141414] placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} required placeholder="••••••••"
              value={password} onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(null); }}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-colors pr-12 text-sm text-[#141414] placeholder-gray-400"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#141414] transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isAuthenticating} className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
          {isAuthenticating ? "Processing..." : "Register Master Workspace"}
          {!isAuthenticating && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="mt-8 text-center">
        <span className="text-sm text-gray-500">Back to secure entryway?</span>
        <button type="button" onClick={() => onSwitchView('login')} className="ml-1 text-sm font-bold text-[#141414] hover:underline">Sign In</button>
      </div>
    </div>
  );
};