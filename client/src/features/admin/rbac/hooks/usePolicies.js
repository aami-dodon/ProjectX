import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchPolicies } from "@/features/admin/rbac/api/rbac-client";

export function usePolicies(filters = {}) {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const serializedFilters = useMemo(() => JSON.stringify(filters ?? {}), [filters]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const parsedFilters = serializedFilters ? JSON.parse(serializedFilters) : {};
      const response = await fetchPolicies(parsedFilters);
      setPolicies(response ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [serializedFilters]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    policies,
    isLoading,
    error,
    refresh: load,
  };
}
