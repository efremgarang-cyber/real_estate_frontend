// src/routes.tsx
import { RouteObject } from "react-router-dom";
import { DashboardOverview } from "./components/dashboard/Overview";
import { KanbanBoard } from "./pages/leads/Kanban";
import { VaultPage } from "./pages/vault/VaultPage";
import { PropertiesPage } from "./pages/properties/Listings";
import { PropertyDetail } from "./pages/properties/PropertyDetails";
import { SettingsPage } from "./pages/Settings";
import SubscriptionPage from './pages/SubscriptionPage';

import { EscrowPage } from "./pages/escrow/EscrowPage";
import { EscrowsListPage } from "./pages/escrow/EscrowListPage";

export const appRoutes: RouteObject[] = [
  { path: "/", element: <DashboardOverview /> },
  { path: "/dashboard", element: <DashboardOverview /> },
  { path: "/properties", element: <PropertiesPage /> },
  { path: "/properties/:id", element: <PropertyDetail /> },
  { path: "/leads", element: <KanbanBoard /> },
  { path: "/vault", element: <VaultPage /> },
  { path: "/settings", element: <SettingsPage /> },
  
  // ✅ SYNCED PLAN ROUTE – Changed from /pricing to /subscriptions
  { path: "/subscriptions", element: <SubscriptionPage /> },
  
  // ✅ ESCROW PIPELINE ROUTES
  { path: "/escrow/:id", element: <EscrowPage /> },
  { path: "/escrows", element: <EscrowsListPage /> },
];