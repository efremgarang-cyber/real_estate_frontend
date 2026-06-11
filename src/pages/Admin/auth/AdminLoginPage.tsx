import React, { useState, useEffect } from "react";
import { useAuth } from "../../../lib/AuthContext";
import { Building2, ArrowRight, Eye, EyeOff, AlertCircle, ShieldCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AdminLoginPage: React.FC = () => {
  const { login, register, user, profile, createAgencyAndProfile } = useAuth();
  const navigate = useNavigate();

  // Auth form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Limbo workspace configuration state
  const [agencyName, setAgencyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agencyError, setAgencyError] = useState<string | null>(null);

  // ── Intelligent Routing Matrix ──
  useEffect(() => {
    if (user && profile) {
      const role = profile.role?.toLowerCase().trim() || 'client';
      if (role === 'admin') {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === 'agent') {
        navigate("/agent/dashboard", { replace: true });
      } else {
        navigate("/client/marketplace", { replace: true });
      }
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    setAuthError(null);
  }, [isSignUp]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      if (isSignUp) {
        await register(email, password, name, "", "admin");
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Authentication failed. Please check your admin credentials and try again.";
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
      setIsProcessing(false);
    }
  };

  // ── Unified Master Login Frame ──────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-6 font-sans">
        <div className="max-w-md w-full p-10 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">

          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 bg-[#141414] rounded-full flex items-center justify-center shadow-md">
               <ShieldCheck size={28} className="text-white" />
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">
            {isSignUp ? "Admin Registration" : "Welcome Back"}
          </h1>
          <p className="text-sm text-center text-gray-500 mb-8">
            {isSignUp ? "Establish your corporate administrative account." : "Sign in to access high-clearance dashboard systems."}
          </p>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-600">{authError}</p>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-5 text-left">
            {isSignUp && (
              <>
                <div className="p-4 bg-gray-50 border-2 border-gray-100 rounded-xl flex items-start gap-3 mb-6">
                  <ShieldCheck size={18} className="text-[#141414] shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-gray-600 leading-relaxed">
                    Creating an <strong className="text-[#141414]">Agency Admin</strong> profile creates a tenant sandbox. Next, you will establish your workspace.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text" required
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-colors text-sm text-[#141414] placeholder-gray-400"
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (authError) setAuthError(null); }}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email" required
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-colors text-sm text-[#141414] placeholder-gray-400"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError(null); }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <button type="button" className="text-[11px] font-bold text-[#141414] hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-colors pr-12 text-sm text-[#141414] placeholder-gray-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(null); }}
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
                  className="w-4 h-4 rounded border-2 border-gray-300 text-[#141414] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer">
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit" disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? "Processing..." : isSignUp ? "Register Master Workspace" : "Sign In"}
              {!isAuthenticating && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-sm text-gray-500">
              {isSignUp ? "Back to secure entryway?" : "Need a brand new workspace?"}
            </span>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-1 text-sm font-bold text-[#141414] hover:underline"
            >
              {isSignUp ? "Sign In" : "Register Agency"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Limbo Screen: Agency Creation Execution ────────────────────────────
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-6 font-sans">
        <div className="max-w-md w-full p-10 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">

          <div className="w-16 h-16 rounded-full bg-[#141414] text-white flex items-center justify-center mx-auto mb-6 shadow-md">
            <Building2 size={28} />
          </div>

          <h2 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">
            Establish Workspace
          </h2>
          <p className="text-sm text-center text-gray-500 mb-8">
            Welcome, <span className="font-bold text-[#141414]">{user.name || 'Admin'}</span>.
            Set up your multi-tenancy business ledger name.
          </p>

          {agencyError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-600">{agencyError}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Legal Agency Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] transition-colors text-sm text-[#141414]"
                placeholder="e.g. Makao Prime Properties"
                value={agencyName}
                onChange={(e) => { setAgencyName(e.target.value); if (agencyError) setAgencyError(null); }}
              />
            </div>
            <button
              disabled={!agencyName || isProcessing}
              onClick={handleCreateAgency}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] hover:bg-black text-white rounded-xl font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Initializing Tenant..." : "Create Agency Core"}
              {!isProcessing && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Redirect fallback ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-[#141414] animate-spin" />
        <p className="text-sm font-bold text-gray-500">Routing security clearance...</p>
      </div>
    </div>
  );
};