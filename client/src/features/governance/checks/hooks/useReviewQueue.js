import { useCallback, useEffect, useMemo, useState } from "react";

import {
  completeReviewQueueItem,
  fetchReviewQueue,
} from "@/features/governance/checks/api/checksClient";

const DEFAULT_FILTERS = {
  state: "",
  priority: "",
};

export function useReviewQueue(initialFilters = {}) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 25, offset: 0 });
  const [summary, setSummary] = useState({ states: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchReviewQueue({
        state: filters.state || undefined,
        priority: filters.priority || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      setItems(response.data ?? []);
      setPagination(response.pagination ?? { total: 0, limit: 25, offset: 0 });
      setSummary(response.summary ?? { states: {} });
    } catch (err) {
      setError(err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters.priority, filters.state, pagination.limit, pagination.offset]);

  useEffect(() => {
    load();
  }, [load]);

  const stateDistribution = useMemo(() => summary.states ?? {}, [summary.states]);

  const completeReview = useCallback(
    async (itemId, payload) => {
      const result = await completeReviewQueueItem(itemId, payload);
      await load();
      return result;
    },
    [load]
  );

  return {
    items,
    pagination,
    filters,
    setFilters,
    summary: stateDistribution,
    isLoading,
    error,
    refresh: load,
    completeReview,
  };
}
