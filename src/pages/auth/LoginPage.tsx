import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { Building2, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LoginPage: React.FC = () => {
  const { login, register, user, profile, createAgencyAndProfile } = useAuth();
  const navigate = useNavigate();
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // NEW: Error State
  const [authError, setAuthError] = useState<string | null>(null);

  // Agency Creation State
  const [agencyName, setAgencyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [agencyError, setAgencyError] = useState<string | null>(null);

  // Automatically redirect when both user and profile are present
  useEffect(() => {
    if (user && profile) {
      navigate("/properties", { replace: true });
    }
  }, [user, profile, navigate]);

  // Clear errors when the user switches between Sign In and Sign Up
  useEffect(() => {
    setAuthError(null);
  }, [isSignUp]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null); // Clear previous errors on new submission
    
    try {
      if (isSignUp) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      console.error("Authentication failed:", error);
      
      // Extract the error message from the backend response (Axios/Fetch standard)
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
    setIsCreating(true);
    setAgencyError(null);
    try {
      await createAgencyAndProfile(agencyName, "Admin");
    } catch (error: any) {
      console.error("Agency creation failed:", error);
      const message = error.response?.data?.message || "Failed to create agency. Please try again.";
      setAgencyError(message);
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0] p-6 font-sans">
        <div className="max-w-md w-full p-10 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col items-center justify-center mb-6">
            <img 
              src="/makao-icon-dark.svg" 
              alt="Makao Logo" 
              className="w-14 h-14 object-contain" 
            />
          </div>
          
          <h1 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-center text-gray-500 mb-6">
            {isSignUp ? "Sign up to start using Makao." : "Sign in to continue to Makao."}
          </p>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-600">{authError}</p>
            </div>
          )}
          
          <form onSubmit={handleAuthSubmit} className="space-y-5 text-left">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (authError) setAuthError(null); // Clear error on typing
                  }}
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (authError) setAuthError(null);
                }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <button type="button" className="text-xs font-semibold text-[#141414] hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center pt-2">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="w-4 h-4 rounded border-gray-300 text-[#141414] focus:ring-[#141414] focus:ring-2 cursor-pointer" 
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer">
                  Remember me
                </label>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-[#141414] hover:bg-black text-white rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? (
                "Processing..."
              ) : isSignUp ? (
                "Sign Up"
              ) : (
                "Sign In"
              )}
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
              className="ml-1 text-sm font-semibold text-[#141414] hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is registered/logged in but has no agency profile yet
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0] p-6 font-sans">
        <div className="max-w-md w-full p-10 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
          <div className="w-14 h-14 rounded-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center mx-auto mb-5 shadow-md">
            <Building2 size={24} />
          </div>

          <h2 className="font-display text-2xl font-bold text-center text-[#141414] mb-2">Initialize Workspace</h2>
          <p className="text-sm text-center text-gray-500 mb-6">
            Welcome, <span className="font-semibold text-[#141414]">{user.name || name || 'User'}</span>. You don't have an agency assigned to your account.
          </p>

          {/* NEW: Agency Error Banner */}
          {agencyError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-600">{agencyError}</p>
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Agency Name
              </label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all"
                placeholder="e.g. Royal Estate Group"
                value={agencyName}
                onChange={(e) => {
                  setAgencyName(e.target.value);
                  if (agencyError) setAgencyError(null);
                }}
              />
            </div>
            
            <button 
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] hover:bg-black text-white rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              disabled={!agencyName || isCreating}
              onClick={handleCreateAgency}
            >
              {isCreating ? "Initializing..." : "Create Agency"}
              {!isCreating && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0]">
      <p className="text-sm font-medium text-gray-500 animate-pulse">Redirecting to your workspace...</p>
    </div>
  );
};