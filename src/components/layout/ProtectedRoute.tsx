import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext"; // Ensure the path to AuthContext matches your project structure

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // 1. Wait for AuthContext to finish checking localStorage/API
  if (loading) return null; 

  // 2. If no user is authenticated, redirect to the login page
  if (!user) return <Navigate to="/auth/login" replace />;

  // 3. If authenticated, render the child routes (AgentLayout or AdminLayout)
  return <Outlet />;
};