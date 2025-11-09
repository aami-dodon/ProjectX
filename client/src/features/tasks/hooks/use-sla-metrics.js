import { useCallback, useEffect, useRef, useState } from "react";

import { fetchTaskSlaMetrics } from "@/features/tasks/api/tasks-client";

const DEFAULT_INTERVAL = 60000;

export function useSlaMetrics({ refreshInterval = DEFAULT_INTERVAL } = {}) {
  const [metrics, setMetrics] = useState({ overdue: 0, atRisk: 0, activeTotal: 0, byEscalationLevel: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchTaskSlaMetrics();
      setMetrics(payload ?? {});
      return payload;
    } catch (err) {
      setMetrics({ overdue: 0, atRisk: 0, activeTotal: 0, byEscalationLevel: {} });
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!refreshInterval) {
      return undefined;
    }

    timerRef.current = setInterval(() => {
      load().catch(() => {});
    }, refreshInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [load, refreshInterval]);

  return {
    metrics,
    isLoading,
    error,
    refresh: load,
  };
}
