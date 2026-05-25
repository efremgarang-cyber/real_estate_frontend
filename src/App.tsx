import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { Shell } from "./components/layout/DashboardLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { appRoutes } from "./routes";

// 1. Converted to a Layout Route using <Outlet />
const ProtectedLayout = () => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0]">
      <div className="font-mono text-xs uppercase animate-pulse">Initializing OS...</div>
    </div>
  );
  
  if (!user || !profile) return <Navigate to="/login" replace />;
  
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes (Shell layout persists across these) */}
          <Route element={<ProtectedLayout />}>
            {appRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}