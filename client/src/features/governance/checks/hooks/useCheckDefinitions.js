import { useCallback, useEffect, useMemo, useState } from "react";

import {
  activateCheckDefinition,
  createCheckDefinition,
  fetchChecks,
  runCheckExecution,
  updateCheckDefinition,
} from "@/features/governance/checks/api/checksClient";

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  type: "",
  severity: "",
};

export function useCheckDefinitions(initialFilters = {}) {
  const [checks, setChecks] = useState([]);
  const [summary, setSummary] = useState({
    status: {},
    type: {},
    severity: {},
    coverage: { totals: {}, distribution: [] },
  });
  const [pagination, setPagination] = useState({ total: 0, limit: 25, offset: 0 });
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [selectedCheckId, setSelectedCheckId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (override = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchChecks({
          search: override.search ?? filters.search ?? undefined,
          status: override.status ?? filters.status ?? undefined,
          type: override.type ?? filters.type ?? undefined,
          severity: override.severity ?? filters.severity ?? undefined,
          limit: override.limit ?? pagination.limit,
          offset: override.offset ?? pagination.offset ?? 0,
        });

        setChecks(response.data ?? []);
        setPagination(response.pagination ?? { total: 0, limit: 25, offset: 0 });
        setSummary(response.summary ?? {});
        if (!selectedCheckId && response.data?.length) {
          setSelectedCheckId(response.data[0].id);
        }
      } catch (err) {
        setError(err);
        setChecks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters.search, filters.severity, filters.status, filters.type, pagination.limit, pagination.offset, selectedCheckId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const selectedCheck = useMemo(
    () => checks.find((check) => check.id === selectedCheckId) ?? null,
    [selectedCheckId, checks]
  );

  const updateFilters = useCallback((nextFilters) => {
    setFilters((previous) => ({
      ...previous,
      ...nextFilters,
    }));
  }, []);

  const createDefinition = useCallback(
    async (payload) => {
      const record = await createCheckDefinition(payload);
      await load();
      setSelectedCheckId(record?.id ?? null);
      return record;
    },
    [load]
  );

  const updateDefinition = useCallback(
    async (checkId, payload) => {
      const record = await updateCheckDefinition(checkId, payload);
      await load();
      return record;
    },
    [load]
  );

  const activateDefinition = useCallback(
    async (checkId) => {
      const record = await activateCheckDefinition(checkId);
      await load();
      return record;
    },
    [load]
  );

  const triggerRun = useCallback(
    async (checkId, payload) => {
      const result = await runCheckExecution(checkId, payload);
      await load();
      return result;
    },
    [load]
  );

  return {
    checks,
    summary,
    pagination,
    filters,
    setFilters: updateFilters,
    selectedCheck,
    setSelectedCheckId,
    refresh: load,
    isLoading,
    error,
    createDefinition,
    updateDefinition,
    activateDefinition,
    runCheck: triggerRun,
  };
}
