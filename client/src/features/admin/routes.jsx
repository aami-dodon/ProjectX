import { Navigate } from "react-router-dom";

import { useAuthStatus, useHasRole } from "@/features/auth";

import { DesignSystemPage } from "@/features/admin/design-system/pages/DesignSystemPage";
import { HealthPage } from "@/features/admin/health/pages/HealthPage";
import { RoleDetailPage, RoleListPage, PolicyEditorPage } from "@/features/admin/rbac";
import { UserManagementPage } from "@/features/admin/user-management/pages/UserManagementPage";
import { RequirePermission } from "@/shared/components/guards/RequirePermission";

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
  {
    path: "/admin/access-control",
    element: (
      <AdminRoute>
        <RequirePermission resource="rbac:roles" action="read" allowRoles={["admin", "compliance officer"]}>
          <RoleListPage />
        </RequirePermission>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/access-control/roles/:roleId",
    element: (
      <AdminRoute>
        <RequirePermission resource="rbac:roles" action="read" allowRoles={["admin", "compliance officer"]}>
          <RoleDetailPage />
        </RequirePermission>
      </AdminRoute>
    ),
  },
  {
    path: "/admin/access-control/policies",
    element: (
      <AdminRoute>
        <RequirePermission resource="rbac:policies" action="read" allowRoles={["admin", "compliance officer"]}>
          <PolicyEditorPage />
        </RequirePermission>
      </AdminRoute>
    ),
  },
];

export { AdminRoute };
