import { useCallback, useEffect, useMemo, useState } from "react";

import {
  archiveControl,
  createControl,
  fetchControls,
  replaceControlMappings,
  triggerControlRemediation,
  updateControl,
} from "@/features/governance/controls/api/controlsClient";

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  risk: "",
  domain: "",
};

export function useControls(initialFilters = {}) {
  const [controls, setControls] = useState([]);
  const [summary, setSummary] = useState({ status: {}, riskTier: {}, domain: {} });
  const [pagination, setPagination] = useState({ total: 0, limit: 25, offset: 0 });
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [selectedControlId, setSelectedControlId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (override = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchControls({
          search: override.search ?? filters.search ?? undefined,
          status: override.status ?? filters.status ?? undefined,
          risk: override.risk ?? filters.risk ?? undefined,
          domain: override.domain ?? filters.domain ?? undefined,
          limit: override.limit ?? pagination.limit,
          offset: override.offset ?? pagination.offset ?? 0,
        });

        setControls(response.data ?? []);
        setSummary(response.summary ?? {});
        setPagination(response.pagination ?? { total: 0, limit: 25, offset: 0 });
        if (!selectedControlId && response.data?.length) {
          setSelectedControlId(response.data[0].id);
        }
      } catch (err) {
        setError(err);
        setControls([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters.domain, filters.risk, filters.search, filters.status, pagination.limit, pagination.offset, selectedControlId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const selectedControl = useMemo(
    () => controls.find((control) => control.id === selectedControlId) ?? null,
    [controls, selectedControlId]
  );

  const updateFilters = useCallback((nextFilters) => {
    setFilters((previous) => ({
      ...previous,
      ...nextFilters,
    }));
  }, []);

  const createDefinition = useCallback(
    async (payload) => {
      const record = await createControl(payload);
      await load();
      setSelectedControlId(record?.id ?? null);
      return record;
    },
    [load]
  );

  const updateDefinition = useCallback(
    async (controlId, payload) => {
      const record = await updateControl(controlId, payload);
      await load();
      return record;
    },
    [load]
  );

  const archiveDefinition = useCallback(
    async (controlId, payload) => {
      const record = await archiveControl(controlId, payload);
      await load();
      return record;
    },
    [load]
  );

  const updateMappings = useCallback(
    async (controlId, frameworkMappings) => {
      const record = await replaceControlMappings(controlId, { frameworkMappings });
      await load();
      return record;
    },
    [load]
  );

  const remediate = useCallback(
    async (controlId, payload) => {
      const result = await triggerControlRemediation(controlId, payload);
      await load();
      return result;
    },
    [load]
  );

  return {
    controls,
    summary,
    pagination,
    filters,
    setFilters: updateFilters,
    selectedControl,
    setSelectedControlId,
    refresh: load,
    isLoading,
    error,
    createDefinition,
    updateDefinition,
    archiveDefinition,
    updateMappings,
    triggerRemediation: remediate,
  };
}
