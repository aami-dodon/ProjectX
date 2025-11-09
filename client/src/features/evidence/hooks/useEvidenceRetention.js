import { useCallback, useEffect, useState } from "react";

import { fetchRetentionSummary } from "@/features/evidence/api/evidenceClient";

export function useEvidenceRetention() {
  const [summary, setSummary] = useState({ stats: {}, policies: [], upcoming: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchRetentionSummary();
      setSummary(response ?? { stats: {}, policies: [], upcoming: [] });
    } catch (err) {
      setError(err);
      setSummary({ stats: {}, policies: [], upcoming: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    summary,
    isLoading,
    error,
    refresh: load,
  };
}
