// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/lib/AuthContext";
import { Loader2 } from "lucide-react";

// Import your split components
import { AuthContainer } from "../../../components/auth/AuthContainer";
import { LoginView } from "../../../components/auth/LoginView";
import { SignUpView } from "../../../components/auth/SignUpView";
import { OtpLoginView } from "@/src/components/auth/OtpLoginView";
import { ForgotPasswordView } from "../../../components/auth/ForgotPasswordView";

type AuthView = 'login' | 'signup' | 'forgot_password' | 'otp_login';

export const LoginPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AuthView>('login');

  // Configure Features Globally
  const ENABLE_OTP_LOGIN = false; // <-- Toggle OTP feature here

  // Intelligent Routing based on Session
  useEffect(() => {
    if (user && profile) {
      const role = profile.role?.toLowerCase() || 'client';
      if (role === 'admin') navigate("/admin", { replace: true });
      else if (role === 'agent') navigate("/agent/dashboard", { replace: true });
      else navigate("/properties", { replace: true });
    }
  }, [user, profile, navigate]);

  // Loading Screen while determining session status
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#141414] animate-spin" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entering Workspace...</p>
        </div>
      </div>
    );
  }

  // Render the currently active view inside the container
  return (
    <AuthContainer onBack={currentView !== 'login' ? () => setCurrentView('login') : undefined}>
      {currentView === 'login' && (
        <LoginView onSwitchView={setCurrentView} enableOtpLogin={ENABLE_OTP_LOGIN} />
      )}
      {currentView === 'signup' && <SignUpView onSwitchView={setCurrentView} />}
      {currentView === 'otp_login' && <OtpLoginView onSwitchView={setCurrentView} />}
      {currentView === 'forgot_password' && <ForgotPasswordView onSwitchView={setCurrentView} />}
    </AuthContainer>
  );
};