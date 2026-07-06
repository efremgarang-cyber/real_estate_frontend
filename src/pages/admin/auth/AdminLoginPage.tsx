// src/pages/AdminLoginPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/lib/AuthContext";
import { Loader2 } from "lucide-react";

// Sub-views
import { AdminAuthContainer } from "../../../components/admin-auth/AdminAuthContainer";
import { AdminLoginView } from "../../../components/admin-auth/AdminLoginView";
import { AdminSignUpView } from "../../../components/admin-auth/AdminSignUpView";
import { AgencySetupView } from "../../../components/admin-auth/AgencySetupView";

export const AdminLoginPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'login' | 'signup'>('login');

  // ── Intelligent Routing Matrix ──
  useEffect(() => {
    if (user && profile) {
      const role = profile.role?.toLowerCase().trim() || 'client';
      if (role === 'admin') navigate("/admin/dashboard", { replace: true });
      else if (role === 'agent') navigate("/agent/dashboard", { replace: true });
      else navigate("/client/marketplace", { replace: true });
    }
  }, [user, profile, navigate]);

  // ── Route: Limbo State (User exists, profile/agency missing) ──
  if (user && !profile) {
    return <AgencySetupView />;
  }

  // ── Route: Redirect Fallback (System is verifying session) ──
  if (user && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#141414] animate-spin" />
          <p className="text-sm font-bold text-gray-500">Routing security clearance...</p>
        </div>
      </div>
    );
  }

  // ── Route: Unauthenticated Forms ──
  return (
    <AdminAuthContainer>
      {currentView === 'login' ? (
        <AdminLoginView onSwitchView={setCurrentView} />
      ) : (
        <AdminSignUpView onSwitchView={setCurrentView} />
      )}
    </AdminAuthContainer>
  );
};