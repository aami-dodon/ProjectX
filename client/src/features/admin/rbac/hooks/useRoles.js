import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchRoles } from "@/features/admin/rbac/api/rbac-client";

export function useRoles({ domain } = {}) {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchRoles({ domain });
      setRoles(response ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => ({
    total: roles.length,
    active: roles.filter((role) => !role.archivedAt).length,
    archived: roles.filter((role) => role.archivedAt).length,
  }), [roles]);

  return {
    roles,
    summary,
    isLoading,
    error,
    refresh: load,
  };
}
