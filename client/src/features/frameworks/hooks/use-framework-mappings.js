import { useCallback, useEffect, useState } from "react";

import {
  createFrameworkMapping,
  fetchFrameworkMappings,
} from "@/features/frameworks/api/frameworks-client";

const DEFAULT_FILTERS = {
  targetFrameworkId: "",
  strength: "",
};

export function useFrameworkMappings(frameworkId, initialFilters = {}) {
  const [mappings, setMappings] = useState([]);
  const [summary, setSummary] = useState({ byStrength: {} });
  const [matrix, setMatrix] = useState([]);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [pagination, setPagination] = useState({ total: 0, limit: 25, offset: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!frameworkId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchFrameworkMappings(frameworkId, {
        targetFrameworkId: filters.targetFrameworkId || undefined,
        strength: filters.strength || undefined,
        limit: pagination.limit,
        offset: pagination.offset ?? 0,
      });

      setMappings(response.data ?? []);
      setSummary(response.summary ?? {});
      setMatrix(response.matrix ?? []);
      setPagination(response.pagination ?? { total: 0, limit: pagination.limit, offset: 0 });
    } catch (err) {
      setError(err);
      setMappings([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters.strength, filters.targetFrameworkId, frameworkId, pagination.limit, pagination.offset]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilters = useCallback((nextFilters) => {
    setFilters((prev) => ({ ...prev, ...nextFilters }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  }, []);

  const createMapping = useCallback(
    async (payload) => {
      if (!frameworkId) return null;
      const record = await createFrameworkMapping(frameworkId, payload);
      await load();
      return record;
    },
    [frameworkId, load]
  );

  return {
    mappings,
    summary,
    matrix,
    filters,
    setFilters: updateFilters,
    pagination,
    setPagination,
    isLoading,
    error,
    createMapping,
    refresh: load,
  };
}
