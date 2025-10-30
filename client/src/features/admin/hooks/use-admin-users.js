import { useCallback, useEffect, useMemo, useState } from "react";

import { apiClient } from "@/shared/lib/client";

export function useAdminUsers({ search, status } = {}) {
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const query = useMemo(() => {
    const params = {};
    if (search) {
      params.search = search;
    }
    if (status) {
      params.status = status;
    }
    return params;
  }, [search, status]);

  const fetchUsers = useCallback(
    async ({ withLoading = true } = {}) => {
      if (withLoading) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const { data } = await apiClient.get("/api/admin/users", {
          params: query,
        });
        setUsers(data?.users ?? []);
        setMetrics(data?.metrics ?? null);
        setRoles(data?.roles ?? []);
      } catch (err) {
        const message = err?.message ?? "Unable to load users";
        setError({ message });
        setUsers([]);
        setMetrics(null);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    fetchUsers({ withLoading: true });
  }, [fetchUsers]);

  const refresh = useCallback((options) => fetchUsers(options), [fetchUsers]);

  const updateUser = useCallback(
    async (userId, updates) => {
      if (!userId) {
        throw new Error("A user id is required to update a user");
      }

      try {
        const { data } = await apiClient.patch(`/api/admin/users/${userId}`, updates);
        const updatedUser = data?.user;
        if (updatedUser) {
          setUsers((prev) =>
            prev.map((user) => (user.id === updatedUser.id ? { ...user, ...updatedUser } : user))
          );
        }
        await fetchUsers({ withLoading: false });
        return updatedUser;
      } catch (err) {
        const message = err?.message ?? "Unable to update user";
        throw new Error(message);
      }
    },
    [fetchUsers]
  );

  return {
    users,
    metrics,
    roles,
    isLoading,
    error,
    refresh,
    updateUser,
  };
}
