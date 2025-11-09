import { useCallback, useEffect, useState } from "react";

import {
  getControl,
  replaceControlMappings,
} from "@/features/governance/controls/api/controlsClient";

export function useControlMappings(controlId) {
  const [control, setControl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!controlId) {
      setControl(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const record = await getControl(controlId);
      setControl(record ?? null);
    } catch (err) {
      setError(err);
      setControl(null);
    } finally {
      setIsLoading(false);
    }
  }, [controlId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveMappings = useCallback(
    async (frameworkMappings) => {
      if (!controlId) return null;
      const record = await replaceControlMappings(controlId, { frameworkMappings });
      setControl(record ?? null);
      return record;
    },
    [controlId]
  );

  return {
    control,
    isLoading,
    error,
    refresh: load,
    saveMappings,
  };
}
