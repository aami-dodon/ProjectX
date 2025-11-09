import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchFrameworkDashboard } from "@/features/dashboards/api/reportsClient";

export function useFrameworkScores(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (override) => {
      setIsLoading(true);
      setError(null);
      try {
        const payload = await fetchFrameworkDashboard(override ?? filters);
        setData(payload);
        return payload;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    load().catch(() => null);
  }, [load]);

  const summary = useMemo(() => data?.summary ?? null, [data?.summary]);
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  return {
    data,
    summary,
    items,
    filters,
    setFilters,
    isLoading,
    error,
    refresh: load,
  };
}
