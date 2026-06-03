import { RouteObject } from "react-router-dom";

// Global / Shared Layouts (Team Member 4)
/*import { AgentLayout } from "./layouts/AgentLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { ClientLayout } from "./layouts/ClientLayout";*/

// Team Architecture Components
import { DashboardOverview } from "./components/Overview";
import { PropertiesPage } from "./pages/properties/Listings";
import { PropertyDetail } from "./pages/properties/PropertyDetails";
import { KanbanBoard } from "./pages/leads/Kanban";
import { SettingsPage } from "./pages/Settings";
import { VaultPage } from "./pages/vault/Vault";
import AgentLayout from "./components/layout/AgentLayout";
import LandingPage from "./pages/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage"; // 👈 Added AuthPage Import

/*// Admin Module Components (Team Member 2 & 1)
import { KycApprovalQueue } from "./pages/admin/KycVerification";
import { SecurityAuditLogs } from "./pages/admin/AuditLogs";
import { UserManagementPortal } from "./pages/admin/Users";
import { FinancialDashboard } from "./pages/admin/Finance";*/

/*// Client Module Components (Team Member 1)
import { SubscriptionTiersPage } from "./pages/client/Subscriptions";
import { EscrowTracker } from "./pages/client/Escrow";*/


export const appRoutes: RouteObject[] = [
  {
    path: "/",
    children: [
      // --- PUBLIC LAYER ---
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },  // 👈 Added Login route
      { path: "signup", element: <LoginPage /> }, // 👈 Added Signup route

      // --- AGENT LAYOUT CONTEXT ---
      {
        path: "agent",
        element: <AgentLayout />,
        children: [
          { index: true, element: <DashboardOverview /> },
          { path: "dashboard", element: <DashboardOverview /> },
          { path: "properties", element: <PropertiesPage /> },
          { path: "properties/:id", element: <PropertyDetail /> },
          { path: "leads", element: <KanbanBoard /> },
          { path: "vault", element: <VaultPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },

      // --- ADMIN SYSTEM LAYOUT CONTEXT ---
      /*{
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <UserManagementPortal /> },
          { path: "users", element: <UserManagementPortal /> },
          { path: "kyc-queue", element: <KycApprovalQueue /> },
          { path: "security-logs", element: <SecurityAuditLogs /> },
          { path: "finance", element: <FinancialDashboard /> },
        ],
      },

      // --- CLIENT / BUYER LAYOUT CONTEXT ---
      {
        path: "client",
        element: <ClientLayout />,
        children: [
          { index: true, element: <SubscriptionTiersPage /> },
          { path: "subscriptions", element: <SubscriptionTiersPage /> },
          { path: "escrow", element: <EscrowTracker /> },
          { path: "marketplace", element: <PropertiesPage /> },
          { path: "marketplace/:id", element: <PropertyDetail /> },
        ],
      },*/
    ],
  },
];

export default appRoutes;