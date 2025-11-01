import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchBranding, updateBranding, DEFAULT_BRANDING } from "./use-branding";

export function useBrandingManagement() {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadBranding = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchBranding();
      setBranding(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranding().catch(() => {
      // Errors handled via state; suppress console noise
    });
  }, [loadBranding]);

  const saveBranding = useCallback(
    async (payload) => {
      setIsSaving(true);
      try {
        const data = await updateBranding(payload);
        setBranding(data);
        setError(null);
        return data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return useMemo(
    () => ({
      branding,
      isLoading,
      isSaving,
      error,
      refresh: loadBranding,
      saveBranding,
    }),
    [branding, error, isLoading, isSaving, loadBranding, saveBranding]
  );
}
