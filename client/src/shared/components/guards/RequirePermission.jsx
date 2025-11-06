import { useMemo } from "react";
import { Navigate } from "react-router-dom";

import { useCurrentUser } from "@/features/auth";
import { usePermission } from "@/features/admin/rbac";

const normalizeList = (value = []) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : null))
        .filter(Boolean)
    : [];

export function RequirePermission({
  resource,
  action,
  domain,
  allowRoles = ["admin"],
  fallback,
  loadingFallback = null,
  children,
}) {
  const currentUser = useCurrentUser();
  const userRoles = useMemo(
    () =>
      (currentUser?.roles ?? [])
        .map((role) => (typeof role?.name === "string" ? role.name.trim().toLowerCase() : null))
        .filter(Boolean),
    [currentUser?.roles]
  );
  const permittedRoles = normalizeList(allowRoles);
  const userHasPrivilegedRole = useMemo(
    () => userRoles.some((role) => permittedRoles.includes(role)),
    [userRoles, permittedRoles]
  );

  const shouldEvaluate = Boolean(resource && action && !userHasPrivilegedRole);
  const { allowed, isLoading } = usePermission({
    resource: shouldEvaluate ? resource : null,
    action: shouldEvaluate ? action : null,
    domain,
  });

  if (userHasPrivilegedRole) {
    return children;
  }

  if (isLoading) {
    return loadingFallback;
  }

  if (!allowed) {
    if (fallback) {
      return fallback;
    }

    return <Navigate to="/403" replace />;
  }

  return children;
}
