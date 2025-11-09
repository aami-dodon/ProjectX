import { useCallback, useEffect, useState } from "react";

import { fetchControlScores } from "@/features/governance/controls/api/controlsClient";

const GRANULARITIES = ["DAILY", "WEEKLY", "MONTHLY"];

export function useControlScores(controlId, initialGranularity = "WEEKLY") {
  const [granularity, setGranularity] = useState(
    GRANULARITIES.includes(initialGranularity) ? initialGranularity : "WEEKLY"
  );
  const [scores, setScores] = useState({ data: [], summary: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!controlId) {
      setScores({ data: [], summary: {} });
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchControlScores(controlId, { granularity });
      setScores(response ?? { data: [], summary: {} });
    } catch (err) {
      setError(err);
      setScores({ data: [], summary: {} });
    } finally {
      setIsLoading(false);
    }
  }, [controlId, granularity]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    granularity,
    setGranularity,
    scores,
    isLoading,
    error,
    refresh: load,
  };
}
