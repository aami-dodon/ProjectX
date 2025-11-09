import { useCallback, useEffect, useState } from "react";

import { fetchRemediationDashboard } from "@/features/dashboards/api/reportsClient";

export function useRemediationMetrics(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (override) => {
      setIsLoading(true);
      setError(null);
      try {
        const payload = await fetchRemediationDashboard(override ?? filters);
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

  return {
    data,
    filters,
    setFilters,
    isLoading,
    error,
    refresh: load,
  };
}
