// src/components/auth/ForgotPasswordView.tsx
import React, { useState } from "react";
import { AlertCircle, Loader2, KeyRound, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/src/lib/api";

export const ForgotPasswordView: React.FC<{ onSwitchView: (view: any) => void }> = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      await api.post('/password/forgot', { email });
      setStep('code');
      setSuccessMsg(`Recovery code sent to ${email}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to request recovery code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return setError("Please enter the 6-digit code.");
    navigate('/update-password', { state: { email, code } });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">
        {step === 'email' ? "Reset Password" : "Verify Code"}
      </h1>
      <p className="text-sm text-center text-gray-500 mb-8">
        {step === 'email' ? "Enter your email to receive a recovery code." : `Enter the 6-digit code sent to ${email}`}
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3">
          <KeyRound size={18} className="text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-green-700">{successMsg}</p>
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleSendCode} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email" required placeholder="you@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414] font-medium"
            />
          </div>
          <button type="submit" disabled={isLoading || !email} className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-black/10">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Send Recovery Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">6-Digit Code</label>
            <input
              type="text" required maxLength={6} placeholder="123456"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-center text-3xl tracking-[0.5em] font-mono text-[#141414] placeholder-gray-200"
            />
          </div>
          <button type="submit" disabled={code.length < 6} className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-black/10">
            Verify & Continue <ArrowRight size={18} />
          </button>
        </form>
      )}
    </div>
  );
};