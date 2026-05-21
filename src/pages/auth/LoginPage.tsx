import React, { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { LogIn, Building2, UserPlus } from "lucide-react";

export const LoginPage: React.FC = () => {
  // Assuming your AuthContext now provides a register function for the email/password/name flow
  const { login, register, user, profile, createAgencyAndProfile } = useAuth();
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Agency Creation State
  const [agencyName, setAgencyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      if (isSignUp) {
        // You'll need to ensure your AuthContext has this register function
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      // Add error handling/toast notifications here
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0] p-6">
        <div className="dashboard-card max-w-md w-full p-10 text-center bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] border-2 border-[#141414]">
          <div className="bg-[#141414] text-[#E4E3E0] w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase mb-1 tracking-tighter italic text-[#141414]">
            Vantage
          </h1>
          <p className="font-mono text-xs text-gray-500 uppercase mb-8 italic">
            Real Estate OS • Workspace Access
          </p>
          
          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5 italic">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="input-field w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-[#141414] outline-none transition-colors"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5 italic">Email Address</label>
              <input 
                type="email" 
                required
                className="input-field w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-[#141414] outline-none transition-colors"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase mb-1.5 italic">Password</label>
              <input 
                type="password" 
                required
                className="input-field w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-[#141414] outline-none transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 mt-6 bg-[#141414] text-white font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? (
                "Processing..."
              ) : isSignUp ? (
                <><UserPlus size={18} /> Create Account</>
              ) : (
                <><LogIn size={18} /> Secure Login</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-gray-100">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-mono text-gray-600 hover:text-[#141414] uppercase italic transition-colors"
            >
              {isSignUp ? "Already have an account? Log in" : "Need an account? Sign up"}
            </button>
          </div>
          
          <p className="mt-6 text-[9px] font-mono text-gray-400 uppercase italic">
            Enterprise Grade Security • Multi-Tenant Isolation
          </p>
        </div>
      </div>
    );
  }

  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0] p-6">
        <div className="dashboard-card max-w-md w-full p-10 bg-white border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
          <h2 className="text-2xl font-black uppercase mb-6 italic text-[#141414]">Initialize Workspace</h2>
          <p className="text-sm text-gray-600 mb-8">
            Welcome, <span className="font-bold">{user.name || name || 'User'}</span>. You don't have an agency assigned to your account. Create a new agency to get started.
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2 italic">Agency Name</label>
              <input 
                type="text" 
                className="input-field w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-[#141414] outline-none transition-colors"
                placeholder="e.g. Royal Estate Group"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
              />
            </div>
            
            <button 
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 bg-[#141414] text-white font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={!agencyName || isCreating}
              onClick={async () => {
                setIsCreating(true);
                try {
                  await createAgencyAndProfile(agencyName, "Admin");
                } catch (e) {
                  setIsCreating(false);
                }
              }}
            >
              {isCreating ? "Initializing..." : "Create Agency"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};