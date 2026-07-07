import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

// Global / Shared Layouts
import { AgentLayout } from "./components/layout/AgentLayout";

// Public / Client Layer
import LandingPage from "./pages/LandingPage";
import { PublicListings } from "./pages/Public/Listings";
import { PublicPropertyDetails } from "./pages/Public/PropertyDetails";
import { PublicOfferCheckout } from "./pages/Public/OfferCheckout";

// Auth Components
import { LoginPage } from "./pages/Agent/auth/LoginPage";

// Agent Module Components
import { DashboardOverview } from "./components/Overview";
import { PropertiesPage } from "./pages/Agent/properties/Listings";
import { PropertyDetail } from "./pages/Agent/properties/PropertyDetails";
import KanbanBoard from './pages/Agent/leads/Kanban';
import { VaultPage } from "./pages/Agent/vault/Vault";
import { Settings } from "./pages/Settings";

import { EscrowPage } from "./pages/Agent/escrow/EscrowPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import { PaymentCallback } from "./pages/PaymentCallback";
import BillingDashboard from "./pages/BillingDashboard";

// Admin Module Components
import {AdminLeads } from './pages/admin/leads/AdminLeads'
import { AdminLayout } from './components/layout/AdminLayout';
import AdminLoginPage from "./pages/Admin/auth/AdminLoginPage";
import { AdminDashboardOverview } from './pages/admin/AdminDashboardOverview';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';
import { UserMonitor } from './pages/admin/UserMonitor';
import { AdminListings } from './pages/admin/properties/AdminListings';
import { AdminPropertyDetails } from './pages/admin/properties/AdminPropertyDetails';
import { AdminVaultPage } from './pages/admin/vault/AdminVaultPage';
import { UpdatePasswordPage } from "./pages/Agent/auth/UpdatePassword";
import { MatchesInbox } from "./pages/Agent/leads/MatchesInbox";
import { EscrowsListPage } from "./pages/escrow/EscrowListPage";

export const appRoutes: RouteObject[

] = [
    {
      path: "/",
      children: [
        // ── Public Client Routes (No Auth Required) ──
        { index: true, element: <LandingPage /> },
        { path: "properties", element: <PublicListings /> },
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
                { path: "matches", element: <MatchesInbox /> },
                { path: "vault", element: <VaultPage /> },
                { path: "settings", element: <Settings key="agent-settings" /> },
                { 
                    path: "escrows", 
                    element: <EscrowsListPage /> 
                },
                { 
                    path: "escrows/:id", 
                    element: <EscrowPage /> 
                },
                { 
                    path: "payment/callback", 
                    element: <PaymentCallback /> 
                },
                { 
                    path: "subscription", 
                    element: <SubscriptionPage /> 
                },
                { 
                    path: "billing", 
                    element: <BillingDashboard /> 
                },
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
                { path: "leads", element: <AdminLeads /> },
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