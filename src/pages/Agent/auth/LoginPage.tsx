import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/lib/AuthContext";
import { Building2, ArrowRight, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, Mail, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/src/lib/api"; // Added API import for the password reset route

export const LoginPage: React.FC = () => {
  const { login, register, user, profile, createAgencyAndProfile } = useAuth();
  const navigate = useNavigate();

  // 1. Auth Form State
  const [isSignUp, setIsSignUp]             = useState(false);
  const [accountType, setAccountType]       = useState<'client' | 'agent'>('client');
  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [agencyCode, setAgencyCode]         = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  
  // 2. Limbo Workspace State
  const [agencyName, setAgencyName]         = useState("");
  
  // 3. UI Status State
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isProcessing, setIsProcessing]         = useState(false);
  const [authError, setAuthError]               = useState<string | null>(null);
  const [agencyError, setAgencyError]           = useState<string | null>(null);

  // 4. Forgot Password Flow State
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'none' | 'email' | 'code'>('none');
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // ─── Intelligent Routing ──────────────────────────────────────────────
  useEffect(() => {
    if (user && profile) {
      const role = profile.role?.toLowerCase() || 'client';
      if (role === 'admin') {
        navigate("/admin", { replace: true });
      } else if (role === 'agent') {
        navigate("/agent/dashboard", { replace: true });
      } else {
        navigate("/client/marketplace", { replace: true });
      }
    }
  }, [user, profile, navigate]);

  // Clear errors when toggling modes
  useEffect(() => {
    setAuthError(null);
    setResetSuccessMessage(null);
  }, [isSignUp, accountType, forgotPasswordStep]);

  // ─── Input Handlers ───────────────────────────────────────────────────
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (authError) setAuthError(null);
      if (agencyError) setAgencyError(null);
  };

  const handleAgencyCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgencyCode(e.target.value.toUpperCase());
    if (authError) setAuthError(null);
  };

  // ─── Submit Handlers ──────────────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      if (isSignUp) {
        await register(
          email, 
          password, 
          name, 
          accountType === 'agent' ? agencyCode : "", 
          accountType
        );
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Authentication failed. Please check your credentials and try again.";
      setAuthError(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCreateAgency = async () => {
    setIsProcessing(true);
    setAgencyError(null);
    
    try {
      await createAgencyAndProfile(agencyName, "Admin");
    } catch (error: any) {
      setAgencyError(error.response?.data?.message || "Failed to create agency. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Forgot Password Handlers ─────────────────────────────────────────
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Hits the real public backend endpoint
      await api.post('/password/forgot', { email: resetEmail });
      
      setForgotPasswordStep('code');
      setResetSuccessMessage(`Recovery code has been sent to ${resetEmail}.`);
    } catch (error: any) {
      setAuthError(error.response?.data?.message || "Failed to request recovery code. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerifyResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resetCode.length < 6) {
      setAuthError("Please enter the 6-digit code.");
      return;
    }

    // We do NOT verify the code with the backend yet. The backend's /password/reset 
    // endpoint requires the new password. So we pass the email and code to the next screen.
    navigate('/update-password', { 
      state: { 
        email: resetEmail, 
        code: resetCode 
      } 
    });
  };

  // ─── Render: Auth Screen ──────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-6 font-sans">
        <div className="max-w-md w-full p-10 border-3 border-gray-300 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">

          {/* Header Logo */}
          <div className="flex flex-col items-center justify-center mb-6 relative">
            {forgotPasswordStep !== 'none' && (
              <button 
                onClick={() => setForgotPasswordStep('none')}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#141414] transition-colors"
                title="Back to login"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center shadow-md">
              <img src="/makao-icon-dark.svg" alt="Makao Logo" className="w-8 h-8 object-contain" />
            </div>
          </div>

          {/* --- FORGOT PASSWORD FLOW --- */}
          {forgotPasswordStep !== 'none' ? (
            <>
              <h1 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">
                {forgotPasswordStep === 'email' ? "Reset Password" : "Verify Code"}
              </h1>
              <p className="text-sm text-center text-gray-500 mb-8">
                {forgotPasswordStep === 'email' 
                  ? "Enter your email address and we'll send you a 6-digit recovery code." 
                  : `Enter the 6-digit code sent to ${resetEmail}`}
              </p>

              {authError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-600">{authError}</p>
                </div>
              )}

              {resetSuccessMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
                  <KeyRound size={18} className="text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-green-700">{resetSuccessMessage}</p>
                </div>
              )}

              {forgotPasswordStep === 'email' ? (
                <form onSubmit={handleSendResetCode} className="space-y-5 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email" required
                        placeholder="you@company.com"
                        value={resetEmail}
                        onChange={handleInputChange(setResetEmail)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414] placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={isAuthenticating || !resetEmail}
                    className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isAuthenticating ? <Loader2 size={18} className="animate-spin" /> : "Send Recovery Code"}
                    {!isAuthenticating && <ArrowRight size={18} />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyResetCode} className="space-y-5 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">6-Digit Code</label>
                    <input
                      type="text" required maxLength={6}
                      placeholder="123456"
                      value={resetCode}
                      onChange={handleInputChange(setResetCode)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-center text-2xl tracking-[0.5em] font-mono text-[#141414] placeholder-gray-300"
                    />
                  </div>
                  <button
                    type="submit" disabled={resetCode.length < 6}
                    className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                  >
                    Verify & Continue
                    <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </>
          ) : (
            /* --- STANDARD LOGIN/SIGNUP FLOW --- */
            <>
              <h1 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-sm text-center text-gray-500 mb-8">
                {isSignUp ? "Sign up to start using Makao." : "Sign in to continue to Makao."}
              </p>

              {authError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-600">{authError}</p>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-5 text-left">
                {isSignUp && (
                  <>
                    <div className="flex gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => setAccountType('client')}
                        className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors border ${
                          accountType === 'client' 
                            ? 'bg-[#141414] text-white border-[#141414]' 
                            : 'bg-white text-gray-500 border-gray-300 hover:border-gray-300'
                        }`}
                      >
                        Client / Buyer
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType('agent')}
                        className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors border ${
                          accountType === 'agent' 
                            ? 'bg-[#141414] text-white border-[#141414]' 
                            : 'bg-white text-gray-500 border-gray-300 hover:border-gray-300'
                        }`}
                      >
                        Agent / Broker
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                      <input
                        type="text" required
                        placeholder="e.g. Jane Doe"
                        value={name}
                        onChange={handleInputChange(setName)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414] placeholder-gray-400"
                      />
                    </div>

                    {accountType === 'agent' && (
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Agency Code <span className="text-gray-400 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          type="text" maxLength={12}
                          placeholder="MAKAO-2026"
                          value={agencyCode}
                          onChange={handleAgencyCodeChange}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all font-mono tracking-widest uppercase text-sm text-[#141414] placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-400 mt-1.5">Ask your Agency Admin for this code.</p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email" required
                    placeholder="you@company.com"
                    value={email}
                    onChange={handleInputChange(setEmail)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414] placeholder-gray-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
                    {!isSignUp && (
                      <button 
                        type="button" 
                        onClick={() => setForgotPasswordStep('email')}
                        className="text-[11px] font-bold text-[#141414] hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} required
                      placeholder="••••••••"
                      value={password}
                      onChange={handleInputChange(setPassword)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all pr-12 text-sm text-[#141414] placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#141414] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {!isSignUp && (
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox" id="remember"
                      className="w-4 h-4 rounded border-gray-300 text-[#141414] focus:ring-[#141414] cursor-pointer"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer">
                      Remember me
                    </label>
                  </div>
                )}

                <button
                  type="submit" disabled={isAuthenticating}
                  className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {isAuthenticating ? <Loader2 size={18} className="animate-spin" /> : (isSignUp ? "Sign Up" : "Sign In")}
                  {!isAuthenticating && <ArrowRight size={18} />}
                </button>
              </form>

              <div className="mt-8 text-center">
                <span className="text-sm text-gray-500">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="ml-1 text-sm font-bold text-[#141414] hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign up"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Limbo Screen (User exists, no agency) ────────────────────
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-6 font-sans">
        <div className="max-w-md w-full p-10 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">

          <div className="w-16 h-16 rounded-full bg-[#141414] text-white flex items-center justify-center mx-auto mb-6 shadow-md">
            <Building2 size={28} />
          </div>

          <h2 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">
            Workspace Required
          </h2>
          <p className="text-sm text-center text-gray-500 mb-8">
            Welcome, <span className="font-bold text-[#141414]">{user.name || 'User'}</span>.
            Create a new agency to continue.
          </p>

          {agencyError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-600">{agencyError}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Agency Name</label>
              <input
                type="text"
                placeholder="e.g. Royal Estate Group"
                value={agencyName}
                onChange={handleInputChange(setAgencyName)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm text-[#141414]"
              />
            </div>
            <button
              disabled={!agencyName || isProcessing}
              onClick={handleCreateAgency}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : "Create Agency"}
              {!isProcessing && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Redirect Fallback ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-[#141414] animate-spin" />
        <p className="text-sm font-bold text-gray-500">Redirecting to your workspace...</p>
      </div>
    </div>
  );
};