import { useCallback, useEffect, useMemo, useState } from "react";

import { apiClient } from "@/shared/lib/client";

const API_PAGE_SIZE = 100;

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
        const baseParams = { ...query, limit: API_PAGE_SIZE, offset: 0 };
        const { data } = await apiClient.get("/api/admin/users", {
          params: baseParams,
        });

        const initialUsers = Array.isArray(data?.users) ? data.users : [];
        const aggregatedUsers = [...initialUsers];
        const pagination = data?.pagination ?? {};
        const total = Number.isInteger(pagination.total)
          ? pagination.total
          : aggregatedUsers.length;
        const pageSize = Number.isInteger(pagination.limit) && pagination.limit > 0
          ? pagination.limit
          : API_PAGE_SIZE;
        let nextOffset =
          (Number.isInteger(pagination.offset) ? pagination.offset : 0) +
          aggregatedUsers.length;

        while (aggregatedUsers.length < total) {
          const { data: nextPage } = await apiClient.get("/api/admin/users", {
            params: { ...query, limit: pageSize, offset: nextOffset },
          });

          const nextUsers = Array.isArray(nextPage?.users) ? nextPage.users : [];
          if (!nextUsers.length) {
            break;
          }

          aggregatedUsers.push(...nextUsers);
          nextOffset += nextUsers.length;
        }

        setUsers(aggregatedUsers);
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
