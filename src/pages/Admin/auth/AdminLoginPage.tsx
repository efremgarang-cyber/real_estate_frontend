import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/lib/AuthContext";
import { Loader2 } from "lucide-react";

import { AdminAuthContainer } from "@/src/components/admin-auth/AdminAuthContainer";
import { AdminLoginView } from "@/src/components/admin-auth/AdminLoginView";
import { AdminSignUpView } from "@/src/components/admin-auth/AdminSignUpView";
import { AgencySetupView } from "@/src/components/admin-auth/AgencySetupView";
// If Trevor built an Admin OTP view, import it here, or reuse the client one.
// import { OtpLoginView } from "@/src/components/auth/OtpLoginView";

// ── ADDED 'otp_login' HERE ──
export type AdminAuthView = 'login' | 'signup' | 'agency_setup' | 'otp_login';

export default function AdminLoginPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminAuthView>('login');

  useEffect(() => {
    if (user && profile) {
      const role = profile.role?.toLowerCase() || 'client';
      if (role === 'admin') {
        navigate("/admin", { replace: true });
      } else {
        // Kick non-admins out of the admin portal immediately
        navigate("/properties", { replace: true });
      }
    }
  }, [user, profile, navigate]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Verifying Clearance...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminAuthContainer onBack={currentView !== 'login' ? () => setCurrentView('login') : undefined}>
      {currentView === 'login' && <AdminLoginView onSwitchView={setCurrentView} />}
      {currentView === 'signup' && <AdminSignUpView onSwitchView={setCurrentView} />}
      {currentView === 'agency_setup' && <AgencySetupView onSwitchView={setCurrentView} />}
      {/* {currentView === 'otp_login' && <OtpLoginView onSwitchView={setCurrentView} />} */}
    </AdminAuthContainer>
  );
}