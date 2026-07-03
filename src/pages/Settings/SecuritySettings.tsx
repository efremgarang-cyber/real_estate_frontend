import React, { useState } from "react";
import { AlertCircle, Loader2, X, ShieldCheck } from "lucide-react";
import { useAuth } from "@/src/lib/AuthContext";
import { api } from "@/src/lib/api";

export const SecuritySettings = () => {
  const { user, setUser } = useAuth(); 
  
  // Read state directly from the global auth session source of truth
  const is2FAEnabled = !!user?.two_factor_enabled;

  const [setupStep, setSetupStep] = useState<'idle' | 'requesting' | 'verifying'>('idle');
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ─── 1. Request Enablement (Sends Email) ───
  const handleInitiate2FA = async () => {
    setSetupStep('requesting');
    setError(null);
    try {
      await api.post('/settings/2fa/request');
      setSetupStep('verifying');
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initiate 2FA setup.");
      setSetupStep('idle');
    }
  };

  // ─── 2. Verify and Enable ───
  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return setError("Enter the 6-digit code.");
    
    setSetupStep('requesting'); 
    setError(null);
    try {
      await api.post('/settings/2fa/enable', { code: otpCode });
      
      if (user && setUser) {
        setUser({ ...user, two_factor_enabled: true });
      }

      setSetupStep('idle');
      setOtpCode("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid code. Try again.");
      setSetupStep('verifying');
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* ── 2FA Section ── */}
      <div className="flex justify-between items-center pb-6 border-b border-gray-100 dark:border-gray-900">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-[#141414] dark:text-white">Two-Factor Authentication</p>
            {is2FAEnabled && (
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Protect your account with an extra layer of security.
          </p>
        </div>
        
        {/* Conditional Render: Swapping button logic out entirely for verification confirmation */}
        {is2FAEnabled ? (
          <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 px-4 py-2 rounded-xl border border-green-100 dark:border-green-900/20 select-none">
            Enabled
          </span>
        ) : (
          <button 
            onClick={handleInitiate2FA}
            disabled={setupStep === 'requesting'}
            className="cursor-pointer px-4 py-2 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-xl text-xs font-bold hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {setupStep === 'requesting' && <Loader2 size={14} className="animate-spin" />}
            Enable 2FA
          </button>
        )}
      </div>

      {/* ── Session Management ── */}
      <div className="flex justify-between items-center pb-6 border-b border-gray-100 dark:border-gray-900">
        <div>
          <p className="font-bold text-sm text-[#141414] dark:text-white">Session Management</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active sessions: Chrome on Mac, Safari on iPhone</p>
        </div>
        <button className="cursor-pointer text-xs font-bold text-red-500 hover:underline">Logout All</button>
      </div>

      {/* ── API Keys ── */}
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold text-sm text-[#141414] dark:text-white">API Keys</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Generate API keys for programmatic access</p>
        </div>
        <button className="cursor-pointer px-4 py-2 bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 text-[#141414] dark:text-white rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors">Generate Key</button>
      </div>

      {/* ── Danger Zone ── */}
      <div className="pt-6">
        <div className="border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/10 p-5 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-700 dark:text-red-400">Danger Zone</p>
            <p className="text-xs font-medium text-red-600 dark:text-red-500 mt-1">Permanently delete your account and all associated data.</p>
            <button className="cursor-pointer mt-3 text-xs font-bold text-red-700 dark:text-red-400 hover:underline">Delete Account</button>
          </div>
        </div>
      </div>

      {/* ── 2FA Verification Modal ── */}
      {setupStep === 'verifying' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setSetupStep('idle'); setOtpCode(""); setError(null); }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            
            <div className="w-12 h-12 bg-[#C5A880]/10 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck size={24} className="text-[#C5A880]" />
            </div>
            
            <h3 className="font-display text-xl font-bold text-[#141414] dark:text-white mb-2">Verify Device</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              We've sent a 6-digit code to your email. Enter it below to secure your account.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-2">
                <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-xs font-medium text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyAndEnable}>
              <input
                type="text" required maxLength={6} autoFocus
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition-all text-center text-3xl tracking-[0.5em] font-mono text-[#141414] dark:text-white placeholder-gray-300 dark:placeholder-gray-700 mb-6"
              />
              <button 
                type="submit" disabled={otpCode.length < 6}
                className="w-full py-3.5 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 transition-colors shadow-lg cursor-pointer"
              >
                Verify & Enable
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};