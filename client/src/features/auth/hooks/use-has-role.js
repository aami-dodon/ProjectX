import { useMemo } from "react";

import { useCurrentUser } from "./use-current-user";

export function useHasRole(roleName) {
  const currentUser = useCurrentUser();

  return useMemo(() => {
    if (!roleName || typeof roleName !== "string") {
      return false;
    }

    const normalized = roleName.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    return (currentUser?.roles ?? []).some((role) => role.name?.toLowerCase() === normalized);
  }, [currentUser?.roles, roleName]);
}
