import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { Shell } from "./components/layout/DashboardLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardOverview } from "./components/dashboard/Overview";
import { KanbanBoard } from "./pages/leads/Kanban";
import { VaultPage } from "./pages/vault/Vault";
import { PropertiesPage } from "./pages/properties/Listings";
import { PropertyDetail } from "./pages/properties/PropertyDetails";
import { motion, AnimatePresence } from "motion/react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0]">
      <div className="font-mono text-xs uppercase animate-pulse">Initializing OS...</div>
    </div>
  );
  
  if (!user || !profile) return <Navigate to="/login" replace />;
  
  return <Shell>{children}</Shell>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
          
          <Route path="/properties" element={<ProtectedRoute><PropertiesPage /></ProtectedRoute>} />
          <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
          <Route path="/vault" element={<ProtectedRoute><VaultPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="dashboard-card h-96 flex flex-col items-center justify-center border-dashed opacity-50">
    <div className="font-black text-3xl uppercase mb-2 italic">{title}</div>
    <div className="font-mono text-[10px] uppercase">Documentation & Logic in Verification Stage</div>
  </div>
);
