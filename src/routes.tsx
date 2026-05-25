import { RouteObject } from "react-router-dom";
import { DashboardOverview } from "./components/dashboard/Overview";
import { KanbanBoard } from "./pages/leads/Kanban";
import { VaultPage } from "./pages/vault/Vault";
import { PropertiesPage } from "./pages/properties/Listings";
import { PropertyDetail } from "./pages/properties/PropertyDetails";
import { SettingsPage } from "./pages/Settings"; // Including the settings page we built

export const appRoutes: RouteObject[] = [
  { path: "/", element: <DashboardOverview /> },
  { path: "/dashboard", element: <DashboardOverview /> },
  { path: "/properties", element: <PropertiesPage /> },
  { path: "/properties/:id", element: <PropertyDetail /> },
  { path: "/leads", element: <KanbanBoard /> },
  { path: "/vault", element: <VaultPage /> },
  { path: "/settings", element: <SettingsPage /> },
];