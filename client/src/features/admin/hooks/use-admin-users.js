import { useCallback, useEffect, useMemo, useState } from "react";

import { apiClient } from "@/shared/lib/client";

const DEFAULT_PAGE_SIZE = 10;

export function useAdminUsers({ initialPageSize = DEFAULT_PAGE_SIZE } = {}) {
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState({
    page: 1,
    pageSize: initialPageSize,
    search: "",
    status: null,
    role: null,
    sort: null,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
  });

  const params = useMemo(() => {
    const next = {
      page: query.page,
      pageSize: query.pageSize,
    };

    const trimmedSearch = query.search?.trim();
    if (trimmedSearch) {
      next.search = trimmedSearch;
    }

    if (query.status) {
      next.status = query.status;
    }

    if (query.role) {
      next.filter = [`role:${query.role}`];
    }

    if (query.sort?.field) {
      const direction = query.sort.direction === "asc" ? "asc" : "desc";
      next.sort = `${query.sort.field}:${direction}`;
    }

    return next;
  }, [query]);

  const fetchUsers = useCallback(
    async ({ withLoading = true } = {}) => {
      if (withLoading) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const { data } = await apiClient.get("/api/admin/users", {
          params,
        });

        setUsers(Array.isArray(data?.users) ? data.users : []);
        setMetrics(data?.metrics ?? null);
        setRoles(Array.isArray(data?.roles) ? data.roles : []);

        const responsePagination = data?.pagination ?? {};
        setPagination({
          page: Number.isInteger(responsePagination.page) ? responsePagination.page : query.page,
          pageSize: Number.isInteger(responsePagination.pageSize)
            ? responsePagination.pageSize
            : query.pageSize,
          total: Number.isInteger(responsePagination.total)
            ? responsePagination.total
            : Number.isInteger(data?.totalCount)
            ? data.totalCount
            : 0,
        });
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
    [params, query.page, query.pageSize]
  );

  useEffect(() => {
    fetchUsers({ withLoading: true });
  }, [fetchUsers]);

  const refresh = useCallback((options) => fetchUsers(options), [fetchUsers]);

  const setPage = useCallback((page) => {
    const parsed = Number.isInteger(page) ? page : Number.parseInt(`${page}`, 10);
    const safePage = Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;

    setQuery((previous) => {
      if (safePage === previous.page) {
        return previous;
      }

      return { ...previous, page: safePage };
    });
  }, []);

  const setPageSize = useCallback(
    (pageSize) => {
      const parsed = Number.isInteger(pageSize) ? pageSize : Number.parseInt(`${pageSize}`, 10);
      const safeSize = Number.isNaN(parsed) || parsed <= 0 ? initialPageSize : parsed;

      setQuery((previous) => ({
        ...previous,
        pageSize: safeSize,
        page: 1,
      }));
    },
    [initialPageSize]
  );

  const setSearch = useCallback((search) => {
    setQuery((previous) => ({
      ...previous,
      search: search ?? "",
      page: 1,
    }));
  }, []);

  const setStatus = useCallback((status) => {
    setQuery((previous) => ({
      ...previous,
      status: status || null,
      page: 1,
    }));
  }, []);

  const setRole = useCallback((role) => {
    setQuery((previous) => ({
      ...previous,
      role: role || null,
      page: 1,
    }));
  }, []);

  const setSort = useCallback((sort) => {
    setQuery((previous) => ({
      ...previous,
      sort: sort ? { field: sort.field, direction: sort.direction } : null,
      page: 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setQuery((previous) => ({
      ...previous,
      search: "",
      status: null,
      role: null,
      page: 1,
    }));
  }, []);

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
    pagination,
    query,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setRole,
    setSort,
    clearFilters,
  };
}
