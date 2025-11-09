import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchCheckResults, publishCheckResult } from "@/features/governance/checks/api/checksClient";

const DEFAULT_FILTERS = {
  status: "",
  severity: "",
};

export function useCheckResults(checkId, initialFilters = {}) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 25, offset: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResultId, setSelectedResultId] = useState(null);

  const load = useCallback(async () => {
    if (!checkId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchCheckResults(checkId, {
        status: filters.status || undefined,
        severity: filters.severity || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      });

      setResults(response.data ?? []);
      setPagination(response.pagination ?? { total: 0, limit: 25, offset: 0 });

      if (!selectedResultId && response.data?.length) {
        setSelectedResultId(response.data[0].id);
      }
    } catch (err) {
      setError(err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [checkId, filters.severity, filters.status, pagination.limit, pagination.offset, selectedResultId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedResult = useMemo(
    () => results.find((result) => result.id === selectedResultId) ?? null,
    [results, selectedResultId]
  );

  const publishResult = useCallback(
    async (resultId, payload) => {
      const record = await publishCheckResult(resultId, payload);
      await load();
      return record;
    },
    [load]
  );

  return {
    results,
    pagination,
    filters,
    setFilters,
    isLoading,
    error,
    refresh: load,
    selectedResult,
    setSelectedResultId,
    publishResult,
  };
}
