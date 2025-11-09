import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createFramework,
  fetchFramework,
  fetchFrameworks,
  updateFramework,
} from "@/features/frameworks/api/frameworks-client";

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  jurisdiction: "",
  publisher: "",
};

export function useFrameworks(initialFilters = {}) {
  const [frameworks, setFrameworks] = useState([]);
  const [summary, setSummary] = useState({ status: {}, jurisdiction: {}, publisher: {} });
  const [pagination, setPagination] = useState({ total: 0, limit: 25, offset: 0 });
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [selectedFrameworkId, setSelectedFrameworkId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (override = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchFrameworks({
          search: (override.search ?? filters.search) || undefined,
          status: (override.status ?? filters.status) || undefined,
          jurisdiction: (override.jurisdiction ?? filters.jurisdiction) || undefined,
          publisher: (override.publisher ?? filters.publisher) || undefined,
          limit: override.limit ?? pagination.limit,
          offset: override.offset ?? pagination.offset ?? 0,
        });

        setFrameworks(response.data ?? []);
        setSummary(response.summary ?? {});
        setPagination(response.pagination ?? { total: 0, limit: 25, offset: 0 });

        if (!selectedFrameworkId && response.data?.length) {
          setSelectedFrameworkId(response.data[0].id);
        }
      } catch (err) {
        setError(err);
        setFrameworks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters.jurisdiction, filters.publisher, filters.search, filters.status, pagination.limit, pagination.offset, selectedFrameworkId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const selectedFramework = useMemo(
    () => frameworks.find((framework) => framework.id === selectedFrameworkId) ?? null,
    [frameworks, selectedFrameworkId]
  );

  const updateFilters = useCallback((nextFilters) => {
    setFilters((prev) => ({ ...prev, ...nextFilters }));
  }, []);

  const createRecord = useCallback(
    async (payload) => {
      const record = await createFramework(payload);
      await load({ offset: 0 });
      setSelectedFrameworkId(record?.id ?? null);
      return record;
    },
    [load]
  );

  const updateRecord = useCallback(
    async (frameworkId, payload) => {
      const record = await updateFramework(frameworkId, payload);
      setDetailCache((prev) => ({
        ...prev,
        [frameworkId]: record ?? null,
      }));
      await load();
      return record;
    },
    [load]
  );

  const getFrameworkById = useCallback(
    async (frameworkId, { force = false } = {}) => {
      if (!frameworkId) return null;
      if (!force && detailCache[frameworkId]) {
        return detailCache[frameworkId];
      }

      const response = await fetchFramework(frameworkId);
      setDetailCache((prev) => ({
        ...prev,
        [frameworkId]: response?.data ?? null,
      }));
      return response?.data ?? null;
    },
    [detailCache]
  );

  return {
    frameworks,
    summary,
    pagination,
    filters,
    setFilters: updateFilters,
    refresh: load,
    selectedFramework,
    setSelectedFrameworkId,
    isLoading,
    error,
    createFramework: createRecord,
    updateFramework: updateRecord,
    getFramework: getFrameworkById,
  };
}
