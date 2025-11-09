import { useCallback, useEffect, useState } from "react";

import { listEvidence } from "@/features/evidence/api/evidenceClient";

const DEFAULT_FILTERS = {
  search: "",
  retentionState: "",
  tag: "",
  controlId: "",
  checkId: "",
};

const DEFAULT_PAGINATION = {
  limit: 25,
  offset: 0,
  total: 0,
};

export function useEvidenceLibrary(initialFilters = {}) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ retention: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listEvidence({
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      setRecords(response.data ?? []);
      setPagination(response.pagination ?? DEFAULT_PAGINATION);
      setSummary(response.summary ?? { retention: {} });
    } catch (err) {
      setError(err);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.limit, pagination.offset]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilters = useCallback((nextFilters) => {
    setPagination((previous) => ({ ...previous, offset: 0 }));
    setFilters((previous) => ({ ...previous, ...nextFilters }));
  }, []);

  const updatePage = useCallback((updater) => {
    setPagination((previous) => ({ ...previous, ...updater }));
  }, []);

  return {
    records,
    summary,
    filters,
    pagination,
    isLoading,
    error,
    refresh: load,
    setFilters: updateFilters,
    setPagination: updatePage,
  };
}
