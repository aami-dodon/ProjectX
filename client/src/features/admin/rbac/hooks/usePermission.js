import { useCallback, useEffect, useState } from "react";

import { checkPermission } from "@/features/admin/rbac/api/rbac-client";

export function usePermission({ resource, action, domain }) {
  const [allowed, setAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const evaluate = useCallback(async () => {
    if (!resource || !action) {
      setAllowed(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkPermission({ resource, action, domain });
      setAllowed(Boolean(result?.allowed));
    } catch (err) {
      setError(err);
      setAllowed(false);
    } finally {
      setIsLoading(false);
    }
  }, [resource, action, domain]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  return {
    allowed,
    isLoading,
    error,
    refresh: evaluate,
  };
}
