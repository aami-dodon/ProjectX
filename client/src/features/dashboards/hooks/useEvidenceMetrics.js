import { useCallback, useEffect, useState } from "react";

import { fetchEvidenceDashboard } from "@/features/dashboards/api/reportsClient";

export function useEvidenceMetrics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchEvidenceDashboard();
      setData(payload);
      return payload;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => null);
  }, [load]);

  return {
    data,
    isLoading,
    error,
    refresh: load,
  };
}
