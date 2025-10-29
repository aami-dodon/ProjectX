import { useMemo } from "react";

import { UserCharts } from "../components/UserCharts";
import { UserStatsCards } from "../components/UserStatsCards";
import { UserTable } from "../components/UserTable";
import { useAdminUsers } from "../hooks/use-admin-users";

export function UserManagementPage() {
  const { users, metrics, isLoading, error, refresh, updateUser } = useAdminUsers();

  const statusDistribution = useMemo(() => metrics?.statusDistribution ?? [], [metrics?.statusDistribution]);
  const monthlyRegistrations = useMemo(
    () => metrics?.monthlyRegistrations ?? [],
    [metrics?.monthlyRegistrations]
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <UserStatsCards totals={metrics?.totals} isLoading={isLoading} />
          <div className="px-4 lg:px-6">
            <UserCharts
              statusDistribution={statusDistribution}
              monthlyRegistrations={monthlyRegistrations}
              isLoading={isLoading}
            />
          </div>
          <UserTable
            users={users}
            isLoading={isLoading}
            error={error}
            onRefresh={refresh}
            onUpdate={updateUser}
          />
        </div>
      </div>
    </div>
  );
}
