import { useCallback, useEffect, useState } from "react";

import {
  createFrameworkVersion,
  fetchFrameworkVersions,
} from "@/features/frameworks/api/frameworks-client";

export function useFrameworkVersions(frameworkId) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!frameworkId) {
      setVersions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchFrameworkVersions(frameworkId);
      setVersions(response.data ?? []);
    } catch (err) {
      setError(err);
      setVersions([]);
    } finally {
      setIsLoading(false);
    }
  }, [frameworkId]);

  useEffect(() => {
    load();
  }, [load]);

  const createVersion = useCallback(
    async (payload) => {
      if (!frameworkId) return null;
      const record = await createFrameworkVersion(frameworkId, payload);
      await load();
      return record;
    },
    [frameworkId, load]
  );

  return {
    versions,
    isLoading,
    error,
    refresh: load,
    createVersion,
  };
}
