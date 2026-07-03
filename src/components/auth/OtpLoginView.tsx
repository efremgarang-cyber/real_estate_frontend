// src/components/auth/OtpLoginView.tsx
import React, { useState } from "react";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/src/lib/AuthContext";
import { api } from "@/src/lib/api";

interface OtpLoginViewProps {
  onSwitchView: (view: any) => void;
}

export const OtpLoginView: React.FC<OtpLoginViewProps> = ({ onSwitchView }) => {
  const { setUser, setProfile } = useAuth();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); 
    setError(null);
    try {
      const response = await api.post('/auth/otp/request', { email });
      // Log the OTP to the console for development testing
      console.log("DEV OTP CODE:", response.data.otp);
      
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return setError("Please enter the 6-digit code.");
    setIsLoading(true); 
    setError(null);
    try {
      const response = await api.post('/auth/otp/verify', { email, code });
      const data = response.data;

      // Ensure critical session fragments exist
      if (!data.token || !data.user) {
        throw new Error("Invalid response schema from authentication endpoint.");
      }

      // Commit the authorization payload to disk
      localStorage.setItem("makao_token", data.token);
      
      // Update global context state to trigger layout router switch instantly
      if (setUser) setUser(data.user);
      if (setProfile) setProfile(data.profile || null);

    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <h1 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">Passwordless Login</h1>
      <p className="text-sm text-center text-gray-500 mb-8">
        {step === 'request' ? "Enter your email to receive a secure login code." : `Enter the code sent to ${email}`}
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email" required placeholder="you@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414] font-medium placeholder-gray-400"
            />
          </div>
          <button type="submit" disabled={isLoading || !email} className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-black/10 cursor-pointer">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Send Login Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">6-Digit OTP</label>
            <input
              type="text" required maxLength={6} placeholder="000000" autoFocus
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-center text-3xl tracking-[0.5em] font-mono text-[#141414] placeholder-gray-200"
            />
          </div>
          <button type="submit" disabled={isLoading || code.length < 6} className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-black/10 cursor-pointer">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Login"}
          </button>
        </form>
      )}
    </div>
  );
};