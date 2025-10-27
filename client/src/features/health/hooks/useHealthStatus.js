import { useCallback, useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/client";

const STATUS_ORDER = ["operational", "degraded", "outage"];

const normalizeStatus = (status) => {
  if (!status) return "unknown";
  const normalized = status.toLowerCase();
  if (STATUS_ORDER.includes(normalized)) {
    return normalized;
  }
  return "unknown";
};

export function useHealthStatus({ autoRefreshMs = 30000 } = {}) {
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async ({ withLoading = true } = {}) => {
    if (withLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await apiClient.get("/api/v1/health");
      const payload = response?.data ?? null;
      const status = payload?.status ? normalizeStatus(payload.status) : "unknown";

      setHealth(
        payload
          ? {
              ...payload,
              status,
            }
          : null
      );
    } catch (err) {
      const message = err?.message ?? "Unable to load system health details.";
      setError({
        status: err?.status ?? null,
        message,
      });
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    if (!autoRefreshMs) {
      return undefined;
    }

    const intervalId = window.setInterval(() => fetchHealth({ withLoading: false }), autoRefreshMs);
    return () => window.clearInterval(intervalId);
  }, [autoRefreshMs, fetchHealth]);

  const summary = useMemo(() => {
    if (!health?.data) {
      return {
        status: health?.status ?? "unknown",
        statuses: {},
      };
    }

    const { system, api, cors } = health.data;
    return {
      status: health.status,
      statuses: {
        system: normalizeStatus(system?.status),
        api: normalizeStatus(api?.status),
        cors: normalizeStatus(cors?.status),
      },
    };
  }, [health]);

  const refresh = useCallback((options) => {
    if (options && typeof options === 'object' && 'preventDefault' in options) {
      options.preventDefault();
      return fetchHealth({ withLoading: true });
    }

    return fetchHealth({ withLoading: true, ...(options ?? {}) });
  }, [fetchHealth]);

  return {
    data: health,
    error,
    isLoading,
    refresh,
    summary,
    refreshInterval: autoRefreshMs,
  };
}
