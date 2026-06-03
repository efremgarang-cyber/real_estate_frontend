import { RouteObject } from "react-router-dom";

// Global / Shared Layouts
import AgentLayout from "./components/layout/AgentLayout";
/* import { AdminLayout } from "./layouts/AdminLayout"; */
/* import { ClientLayout } from "./layouts/ClientLayout"; */

// Public / Shared Layer
import LandingPage from "./pages/LandingPage";
import { LoginPage } from "./pages/Agent/auth/LoginPage";
import { AdminLoginPage } from "./pages/Admin/auth/AdminLoginPage"; // 👈 Admin login

// Agent Module Components
import { DashboardOverview } from "./components/Overview";
import { PropertiesPage } from "./pages/Agent/properties/Listings";
import { PropertyDetail } from "./pages/Agent/properties/PropertyDetails";
import { KanbanBoard } from "./pages/Agent/leads/Kanban";
import { VaultPage } from "./pages/Agent/vault/Vault";
import { SettingsPage } from "./pages/Settings";

// Admin Module Components
import { AdminPropertyDetails } from "./pages/Admin/properties/AdminPropertyDetails";
import { AdminVaultPage } from "./pages/Admin/vault/AdminVaultPage";
/* import { KycApprovalQueue } from "./pages/Admin/KycVerification";
import { SecurityAuditLogs } from "./pages/Admin/AuditLogs";
import { UserManagementPortal } from "./pages/Admin/Users";
import { FinancialDashboard } from "./pages/Admin/Finance"; 
*/

/* // Client Module Components
import { SubscriptionTiersPage } from "./pages/client/Subscriptions";
import { EscrowTracker } from "./pages/client/Escrow"; 
*/

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    children: [
      // --- PUBLIC LAYER ---
      { index: true, element: <LandingPage /> },

      // --- UNIFIED AUTH ROUTING MODULE ---
      {
        path: "auth",
        children: [
          { path: "login", element: <LoginPage /> },        // 👈 Agent/Client login: /auth/login
          { path: "signup", element: <LoginPage /> },       // 👈 Agent/Client signup: /auth/signup
          { path: "admin-login", element: <AdminLoginPage /> }, // 👈 High-clearance Admin login: /auth/admin-login
        ],
      },

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
      /* {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <UserManagementPortal /> },
          { path: "users", element: <UserManagementPortal /> },
          { path: "properties/:id", element: <AdminPropertyDetails /> }, 
          { path: "vault", element: <AdminVaultPage /> },               
          { path: "kyc-queue", element: <KycApprovalQueue /> },
          { path: "security-logs", element: <SecurityAuditLogs /> },
          { path: "finance", element: <FinancialDashboard /> },
        ],
      },
      */

      // --- CLIENT / BUYER LAYOUT CONTEXT ---
      /* {
        path: "client",
        element: <ClientLayout />,
        children: [
          { index: true, element: <SubscriptionTiersPage /> },
          { path: "subscriptions", element: <SubscriptionTiersPage /> },
          { path: "escrow", element: <EscrowTracker /> },
          { path: "marketplace", element: <PropertiesPage /> },
          { path: "marketplace/:id", element: <PropertyDetail /> },
        ],
      }, 
      */
    ],
  },
];

export default appRoutes;