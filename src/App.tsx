import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { appRoutes } from "./routes";

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
    <AuthProvider>
      <Router>
        <Routes>
          {renderRoutes(appRoutes)}
          {/* Global Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}