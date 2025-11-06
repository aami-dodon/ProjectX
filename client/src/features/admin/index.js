export { adminRoutes, AdminRoute } from "@/features/admin/routes";
export { DesignSystemPage } from "@/features/admin/design-system/pages/DesignSystemPage";
export { useDesignSystem } from "@/features/admin/design-system/hooks/useDesignSystem";
export { HealthPage } from "@/features/admin/health/pages/HealthPage";
export { useHealthStatus } from "@/features/admin/health/hooks/useHealthStatus";
export { UserManagementPage } from "@/features/admin/user-management/pages/UserManagementPage";
export { useAdminUsers } from "@/features/admin/user-management/hooks/use-admin-users";
export { useAuditLogs } from "@/features/admin/user-management/hooks/use-audit-logs";
export { useClientRuntimeMetrics } from "@/features/admin/user-management/hooks/useClientRuntimeMetrics";
export {
  RoleListPage,
  RoleDetailPage,
  PolicyEditorPage,
  useRoles as useAdminRoles,
  usePolicies as useAdminPolicies,
  useRoleAssignments,
  usePermission as useRbacPermission,
} from "@/features/admin/rbac";
