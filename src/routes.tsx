import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

// Global / Shared Layouts
import { AgentLayout } from "./components/layout/AgentLayout";
import { AdminLayout } from "./components/layout/AdminLayout"; 

// Public / Shared Layer
import LandingPage from "./pages/LandingPage";
import { LoginPage } from "./pages/Agent/auth/LoginPage";
import { AdminLoginPage } from "./pages/Admin/auth/AdminLoginPage";

// Agent Module Components
import { DashboardOverview } from "./components/Overview";
import { PropertiesPage } from "./pages/Agent/properties/Listings";
import { PropertyDetail } from "./pages/Agent/properties/PropertyDetails";
import { KanbanBoard } from "./pages/Agent/leads/Kanban";
import { VaultPage } from "./pages/Agent/vault/Vault";
import { Settings } from "./pages/Settings";

// ✨ Your Feature Components (Added Back)
import { EscrowPage } from "./pages/EscrowPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";

// Admin Module Components
import { AdminDashboardOverview } from "./pages/Admin/AdminDashboardOverview";
import { AdminListings } from "./pages/Admin/properties/AdminListings"; 
import { AdminPropertyDetails } from "./pages/Admin/properties/AdminPropertyDetails";
import { AdminVaultPage } from "./pages/Admin/vault/AdminVaultPage";
import { AdminLeadsDashboard } from "./pages/Admin/leads/AdminLeads"; 
import { UserMonitor } from "./pages/Admin/UserMonitor";
import { AdminSecurityPage } from "./pages/Admin/AdminSecurityPage";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    children: [
      { index: true, element: <LandingPage /> },
      {
        path: "auth",
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <LoginPage /> },
          { path: "admin-login", element: <AdminLoginPage /> },
        ],
      },
      {
        path: "agent",
        element: <ProtectedRoute />,
        children: [
          {
            element: <AgentLayout />,
            children: [
              { index: true, element: <DashboardOverview /> },
              { path: "dashboard", element: <DashboardOverview /> },
              { path: "properties", element: <PropertiesPage /> },
              { path: "properties/:id", element: <PropertyDetail /> },
              { path: "leads", element: <KanbanBoard /> },
              { path: "vault", element: <VaultPage /> },
              { path: "settings", element: <Settings key="agent-settings" /> },
              
              // 🚀 Your Integrated Feature Modules
              { path: "escrows", element: <EscrowPage /> },
              { path: "plans", element: <SubscriptionPage /> },
            ],
          },
        ],
      },
      {
        path: "admin",
        element: <ProtectedRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboardOverview /> },
              { path: "dashboard", element: <AdminDashboardOverview /> },
              { path: "properties", element: <AdminListings /> },
              { path: "properties/:id", element: <AdminPropertyDetails /> },
              { path: "leads", element: <AdminLeadsDashboard /> },
              { path: "vault", element: <AdminVaultPage /> },
              { path: "users", element: <UserMonitor /> },
              { path: "security", element: <AdminSecurityPage /> },
              { path: "settings", element: <Settings key="admin-settings" /> },
            ],
          },
        ],
      },
    ],
  },
];

export default appRoutes;