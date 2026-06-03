import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/AuthContext";
import { appRoutes } from "./routes";

// 1. Initialize the Query Client with global cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache data for 5 minutes before considering it stale
      refetchOnWindowFocus: false, // Prevent background refetches when the user clicks back into the browser tab
      retry: 1, // Only retry failed requests once before throwing an error
    },
  },
});

// Recursive route mapper that cleanly builds out index, parent, and child paths
const renderRoutes = (routes: any[]) => {
  return routes.map((route, index) => (
    <Route 
      key={route.path || `route-${index}`} 
      index={route.index} 
      path={route.path} 
      element={route.element}
    >
      {route.children && renderRoutes(route.children)}
    </Route>
  ));
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <Router>
        <Routes>
          {renderRoutes(appRoutes)}
          {/* Global Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
    </QueryClientProvider>
  );
}