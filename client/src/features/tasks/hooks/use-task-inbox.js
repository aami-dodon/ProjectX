import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchTasks } from "@/features/tasks/api/tasks-client";

const DEFAULT_FILTERS = {
  limit: 25,
  offset: 0,
  sort: "updatedAt:desc",
};

export function useTaskInbox(initialFilters = {}) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({ status: {}, priority: {}, escalation: {}, sla: {} });
  const [pagination, setPagination] = useState({ total: 0, limit: DEFAULT_FILTERS.limit, offset: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const latestFiltersRef = useRef(filters);

  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  const load = useCallback(async (nextFilters) => {
    const resolved = nextFilters ?? latestFiltersRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchTasks(resolved);
      setTasks(payload.data ?? []);
      setSummary(payload.summary ?? {});
      setPagination(payload.pagination ?? { total: 0, limit: resolved.limit ?? 25, offset: resolved.offset ?? 0 });
      return payload;
    } catch (err) {
      setTasks([]);
      setSummary({ status: {}, priority: {}, escalation: {}, sla: {} });
      setPagination({ total: 0, limit: resolved.limit ?? 25, offset: resolved.offset ?? 0 });
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters).catch(() => {});
  }, [filters, load]);

  const updateFilters = useCallback((updater) => {
    setFilters((previous) => {
      const nextValue = typeof updater === "function" ? updater(previous) : { ...previous, ...updater };
      return { ...nextValue, offset: nextValue.offset ?? 0 };
    });
  }, []);

  const derived = useMemo(
    () => ({
      total: pagination.total ?? 0,
      openTasks: (summary.status?.OPEN ?? 0) + (summary.status?.IN_PROGRESS ?? 0),
      overdue: summary?.sla?.overdue ?? 0,
      atRisk: summary?.sla?.atRisk ?? 0,
    }),
    [pagination.total, summary],
  );

  const refresh = useCallback(() => load(filters), [filters, load]);

  return {
    tasks,
    summary,
    pagination,
    filters,
    setFilters: updateFilters,
    derived,
    isLoading,
    error,
    refresh,
  };
}
