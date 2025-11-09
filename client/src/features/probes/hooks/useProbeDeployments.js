import { useCallback, useEffect, useState } from "react";

import { createDeployment, fetchDeployments } from "@/features/probes/api/probesClient";

export function useProbeDeployments(probeId, { autoRefreshMs = 30000 } = {}) {
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!probeId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchDeployments(probeId);
      setDeployments(response ?? []);
    } catch (err) {
      setError(err);
      setDeployments([]);
    } finally {
      setIsLoading(false);
    }
  }, [probeId]);

  useEffect(() => {
    load();
    if (!autoRefreshMs) return undefined;
    const interval = window.setInterval(load, autoRefreshMs);
    return () => window.clearInterval(interval);
  }, [autoRefreshMs, load]);

  const launchDeployment = useCallback(
    async (payload) => {
      if (!probeId) return null;
      const record = await createDeployment(probeId, payload);
      await load();
      return record;
    },
    [load, probeId]
  );

  return {
    deployments,
    isLoading,
    error,
    refresh: load,
    launchDeployment,
  };
}
