import { useCallback, useEffect, useState } from "react";

import { fetchRoleDetail } from "@/features/admin/rbac/api/rbac-client";

export function useRoleAssignments(roleId) {
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!roleId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const detail = await fetchRoleDetail(roleId);
      setRole(detail ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    role,
    assignments: role?.assignments ?? [],
    policies: role?.policies ?? [],
    isLoading,
    error,
    refresh: load,
  };
}
