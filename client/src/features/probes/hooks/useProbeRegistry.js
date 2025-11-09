import { useCallback, useEffect, useMemo, useState } from "react";

import { createProbe, fetchProbes } from "@/features/probes/api/probesClient";

const STATUS_ORDER = ["draft", "active", "deprecated"];

const normalizeStatus = (status) => {
  if (!status) return "unknown";
  const normalized = status.toLowerCase();
  return STATUS_ORDER.includes(normalized) ? normalized : "unknown";
};

export function useProbeRegistry(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [probes, setProbes] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 0, offset: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchProbes(filters);
      const items = (response.data ?? []).map((probe) => ({
        ...probe,
        status: normalizeStatus(probe.status),
      }));

      setProbes(items);
      setPagination(response.pagination ?? { total: items.length, limit: items.length, offset: 0 });
    } catch (err) {
      setError(err);
      setProbes([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const registerProbe = useCallback(
    async (payload) => {
      await createProbe(payload);
      await load();
    },
    [load]
  );

  const statusSummary = useMemo(() => {
    return probes.reduce(
      (acc, probe) => {
        const key = normalizeStatus(probe.status);
        acc.totals[key] = (acc.totals[key] ?? 0) + 1;
        if (!acc.recent && probe.deployments?.length) {
          acc.recent = probe.deployments[0];
        }
        return acc;
      },
      { totals: {}, recent: null }
    );
  }, [probes]);

  return {
    probes,
    pagination,
    filters,
    setFilters,
    isLoading,
    error,
    refresh: load,
    registerProbe,
    statusSummary,
  };
}
