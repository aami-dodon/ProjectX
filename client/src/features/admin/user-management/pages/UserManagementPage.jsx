import { useCallback, useMemo } from "react";

import { UserCharts } from "../components/charts/UserCharts";
import { UserStatsCards } from "../components/stats/UserStatsCards";
import { UserTable } from "../components/table/UserTable";
import { useAdminUsers } from "../hooks/use-admin-users";

export function UserManagementPage() {
  const {
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
  } = useAdminUsers();
  const refreshTable = useCallback(() => refresh({ withLoading: false }), [refresh]);

  const statusDistribution = useMemo(() => metrics?.statusDistribution ?? [], [metrics?.statusDistribution]);
  const monthlyRegistrations = useMemo(
    () => metrics?.monthlyRegistrations ?? [],
    [metrics?.monthlyRegistrations]
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <UserStatsCards totals={metrics?.totals} isLoading={isLoading} />
          </div>
          <div className="px-4 lg:px-6">
            <UserCharts
              statusDistribution={statusDistribution}
              monthlyRegistrations={monthlyRegistrations}
              isLoading={isLoading}
            />
          </div>
          <div className="px-4 lg:px-6">
            <UserTable
              users={users}
              availableRoles={roles}
              isLoading={isLoading}
              error={error}
              onRefresh={refreshTable}
              onUpdate={updateUser}
              pagination={pagination}
              searchTerm={query.search}
              statusFilter={query.status}
              roleFilter={query.role}
              sort={query.sort}
              onSearchChange={setSearch}
              onStatusFilterChange={setStatus}
              onRoleFilterChange={setRole}
              onPaginationChange={setPage}
              onPageSizeChange={setPageSize}
              onSortChange={setSort}
              onClearFilters={clearFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
