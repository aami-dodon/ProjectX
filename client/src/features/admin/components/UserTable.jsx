import * as React from "react"

import { Card, CardContent } from "@/shared/components/ui/card"
import { Tabs } from "@/shared/components/ui/tabs"

import { UserTableHeader } from "./user-table/UserTableToolbar"
import { UsersTab } from "./tabs/UsersTab"
import { AuditTab } from "./tabs/AuditTab"
import { ReportsTab } from "./tabs/ReportsTab"

export { schema, TableCellViewer } from "./user-table/UserTableDrawer"

export function UserTable({
  users = [],
  availableRoles = [],
  isLoading = false,
  error,
  onUpdate,
  onRefresh,
}) {
  const [activeView, setActiveView] = React.useState("users")

  return (
    <Card className="flex h-full flex-col">
      <Tabs value={activeView} onValueChange={setActiveView} className="flex h-full flex-col">
        <UserTableHeader activeView={activeView} onViewChange={setActiveView} />
        <CardContent className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          <UsersTab
            users={users}
            availableRoles={availableRoles}
            isLoading={isLoading}
            error={error}
            onUpdate={onUpdate}
            onRefresh={onRefresh}
          />
          <AuditTab />
          <ReportsTab />
        </CardContent>
      </Tabs>
    </Card>
  )
}
