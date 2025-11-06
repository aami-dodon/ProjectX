import { Navigate } from "react-router-dom";

import { useAuthStatus, useHasRole } from "@/features/auth";

import { DesignSystemPage } from "./design-system/pages/DesignSystemPage";
import { HealthPage } from "./health/pages/HealthPage";
import { UserManagementPage } from "./user-management/pages/UserManagementPage";

function AdminRoute({ children }) {
  const isAuthenticated = useAuthStatus();
  const hasAdminRole = useHasRole("admin");

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!hasAdminRole) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export const adminRoutes = [
  {
    path: "/admin/health",
    element: (
      <AdminRoute>
        <HealthPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/design-system",
    element: (
      <AdminRoute>
        <DesignSystemPage />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <AdminRoute>
        <UserManagementPage />
      </AdminRoute>
    ),
  },
];

export { AdminRoute };
