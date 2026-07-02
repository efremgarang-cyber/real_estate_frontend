// src/components/auth/SignUpView.tsx
import React, { useState } from "react";
import { useAuth } from "@/src/lib/AuthContext";
import { AlertCircle, Loader2 } from "lucide-react";

export const SignUpView: React.FC<{ onSwitchView: (view: any) => void }> = ({ onSwitchView }) => {
  const { register } = useAuth();
  const [accountType, setAccountType] = useState<'client' | 'agent'>('client');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyCode, setAgencyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      await register(email, password, name, accountType === 'agent' ? agencyCode : "", accountType);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">Create Account</h1>
      <p className="text-sm text-center text-gray-500 mb-6">Sign up to start using Makao.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3 mb-2 bg-gray-50 p-1.5 rounded-xl border border-gray-400">
          <button type="button" onClick={() => setAccountType('client')} className={`cursor-pointer flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${accountType === 'client' ? 'bg-white text-[#141414] border border-gray-400' : 'text-gray-500 hover:text-gray-700'}`}>
            Client
          </button>
          <button type="button" onClick={() => setAccountType('agent')} className={`cursor-pointer flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${accountType === 'agent' ? 'bg-white text-[#141414] border border-gray-400' : 'text-gray-500 hover:text-gray-700'}`}>
            Agent
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium" />
        </div>

        {accountType === 'agent' && (
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Agency Code <span className="lowercase font-medium text-gray-300">(optional)</span></label>
            <input type="text" value={agencyCode} onChange={(e) => setAgencyCode(e.target.value.toUpperCase())} placeholder="MAKAO-2026" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-mono tracking-widest uppercase text-sm" />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium" />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm font-medium" />
        </div>

        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-black/10">
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <span className="text-sm text-gray-500">Already have an account?</span>
        <button onClick={() => onSwitchView('login')} className="ml-2 text-sm font-bold text-[#141414] hover:text-[#C5A880] transition-colors">Sign In</button>
      </div>
    </div>
  );
};