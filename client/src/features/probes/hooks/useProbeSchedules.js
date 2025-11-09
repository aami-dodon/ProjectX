import { useCallback, useEffect, useState } from "react";

import { createSchedule, fetchSchedules } from "@/features/probes/api/probesClient";

export function useProbeSchedules(probeId) {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!probeId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchSchedules(probeId);
      setSchedules(response ?? []);
    } catch (err) {
      setError(err);
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  }, [probeId]);

  useEffect(() => {
    load();
  }, [load]);

  const persistSchedule = useCallback(
    async (payload) => {
      if (!probeId) return null;
      const record = await createSchedule(probeId, payload);
      await load();
      return record;
    },
    [load, probeId]
  );

  return {
    schedules,
    isLoading,
    error,
    refresh: load,
    persistSchedule,
  };
}
