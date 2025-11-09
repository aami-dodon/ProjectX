import { useCallback, useEffect, useState } from "react";

import { fetchProbeMetrics } from "@/features/probes/api/probesClient";

export function useProbeMetrics(probeId, { refreshMs = 20000 } = {}) {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!probeId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchProbeMetrics(probeId);
      setMetrics(response ?? null);
    } catch (err) {
      setError(err);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  }, [probeId]);

  useEffect(() => {
    load();
    if (!refreshMs) return undefined;
    const interval = window.setInterval(load, refreshMs);
    return () => window.clearInterval(interval);
  }, [load, refreshMs]);

  return {
    metrics,
    isLoading,
    error,
    refresh: load,
  };
}
