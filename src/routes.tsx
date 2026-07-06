import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

// Global / Shared Layouts
import { AgentLayout } from "./components/layout/AgentLayout";
import { AdminLayout } from "./components/layout/AdminLayout"; 

// Public / Client Layer
import LandingPage from "./pages/LandingPage";
import { PublicListings } from "./pages/Public/Listings";
import { PublicPropertyDetails } from "./pages/Public/PropertyDetails";
import { PublicOfferCheckout } from "./pages/Public/OfferCheckout";

// Auth Components
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
import { EscrowPage } from "./pages/Agent/escrow/EscrowPage";
import SubscriptionPage from "./pages/SubscriptionPage";

// Admin Module Components
import { AdminDashboardOverview } from "./pages/Admin/AdminDashboardOverview";
import { AdminListings } from "./pages/Admin/properties/AdminListings"; 
import { AdminPropertyDetails } from "./pages/Admin/properties/AdminPropertyDetails";
import { AdminVaultPage } from "./pages/Admin/vault/AdminVaultPage";
import { AdminLeadsDashboard } from "./pages/Admin/leads/AdminLeads"; 
import { UserMonitor } from "./pages/Admin/UserMonitor";
import { AdminSecurityPage } from "./pages/Admin/AdminSecurityPage";
import { UpdatePasswordPage } from "./pages/Agent/auth/UpdatePassword";
import { AdminAgencies } from "./pages/Admin/AdminAgencies"; 


export const appRoutes: RouteObject[
  
] = [
  {
    path: "/",
    children: [
      // ── Public Client Routes (No Auth Required) ──
      { index: true, element: <LandingPage /> },
      {path: "properties", element: <PublicListings />},
      { path: "properties/:id", element: <PublicPropertyDetails /> },
      { path: "properties/:id/offer", element: <PublicOfferCheckout /> },
      { path: "update-password", element: <UpdatePasswordPage /> },
      
      // ── Authentication ──
      {
        path: "auth",
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <LoginPage /> },
          { path: "admin-login", element: <AdminLoginPage /> },
        ],
      },

      // ── Agent Protected Routes ──
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
              { path: "escrows", element: <EscrowPage /> },
              { path: "plans", element: <SubscriptionPage /> },
            ],
          },
        ],
      },

      // ── Admin Protected Routes ──
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
              { path: "agencies", element: <AdminAgencies /> },
              { path: "agencies/:id", element: <div className="p-8 font-sans"><h1 className="text-2xl font-bold">Agency Workspace Profile</h1><p className="text-gray-400 text-sm mt-1">Detailed compliance and metric layout coming soon.</p></div> },
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