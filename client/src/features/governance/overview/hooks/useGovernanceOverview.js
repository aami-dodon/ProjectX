import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchGovernanceOverview,
  recalculateGovernanceScores,
  triggerGovernanceRuns,
} from "@/features/governance/overview/api/overviewClient";

export function useGovernanceOverview() {
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchGovernanceOverview();
      setOverview(payload);
      return payload;
    } catch (err) {
      setOverview(null);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {
      // handled via error state
    });
  }, [refresh]);

  const triggerRuns = useCallback(
    async (payload) => {
      setIsMutating(true);
      try {
        const result = await triggerGovernanceRuns(payload);
        await refresh().catch(() => {});
        return result;
      } finally {
        setIsMutating(false);
      }
    },
    [refresh]
  );

  const recalcScores = useCallback(
    async (payload) => {
      setIsMutating(true);
      try {
        const result = await recalculateGovernanceScores(payload);
        await refresh().catch(() => {});
        return result;
      } finally {
        setIsMutating(false);
      }
    },
    [refresh]
  );

  const derived = useMemo(
    () => ({
      summary: overview?.summary ?? {},
      controls: overview?.controls ?? { byStatus: {}, byRiskTier: {}, spotlight: [] },
      trend: overview?.trend ?? { labels: [], values: [] },
      frameworks: overview?.frameworks ?? { total: 0, withCoverage: 0, coveragePercent: 0, items: [] },
      reviewQueue: overview?.reviewQueue ?? { byState: {}, overdue: 0, urgent: [] },
      runs: overview?.runs ?? [],
      evidence: overview?.evidence ?? [],
      checks: overview?.checks ?? { byStatus: {}, byType: {}, bySeverity: {} },
    }),
    [overview]
  );

  return {
    overview,
    ...derived,
    isLoading,
    isRefreshing: isLoading,
    isMutating,
    error,
    refresh,
    triggerRuns,
    recalcScores,
  };
}
