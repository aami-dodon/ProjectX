import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import {
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconDotsVertical,
  IconGripVertical,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { DataTable as SharedDataTable } from "@/shared/components/data-table"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Checkbox } from "@/shared/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Tabs, TabsContent } from "@/shared/components/ui/tabs"

import { useAuditLogs } from "../hooks/use-audit-logs"
import { UserTableHeader, UserTableToolbar } from "./user-table/UserTableToolbar"
import {
  TableCellViewer as UserTableDrawerCellViewer,
  STATUS_BADGE_STYLES,
  STATUS_LABELS,
  RoleBadge,
  formatDate,
} from "./user-table/UserTableDrawer"

export { schema, TableCellViewer } from "./user-table/UserTableDrawer"

function formatAuditSnapshot(value) {
  if (value === null || typeof value === "undefined") {
    return null
  }

  if (typeof value === "string") {
    const trimmed = value.trim()

    if (!trimmed) {
      return null
    }

    try {
      const parsed = JSON.parse(trimmed)
      return formatAuditSnapshot(parsed)
    } catch {
      return trimmed
    }
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`
  }

  if (Array.isArray(value) || typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return `${value}`
    }
  }

  return `${value}`
}

function DragHandle({ id }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent">
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

export function UserTable({
  users = [],
  availableRoles = [],
  isLoading = false,
  error,
  onUpdate,
  onRefresh,
}) {
  const [activeView, setActiveView] = React.useState("users")
  const [data, setData] = React.useState(() => users ?? [])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [drawerState, setDrawerState] = React.useState({ userId: null, tab: "view" })
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const tableIsLoading = isLoading || isRefreshing

  const {
    logs: auditLogs,
    isLoading: isLoadingAuditLogs,
    error: auditLogsError,
    refresh: refreshAuditLogs,
  } = useAuditLogs({ model: "AuthUser", limit: 100 })

  const handleRefresh = React.useCallback(async () => {
    if (typeof onRefresh !== "function") {
      return
    }

    try {
      setIsRefreshing(true)
      await onRefresh()
    } catch (error) {
      const message = error?.message ?? "Unable to refresh users"
      toast.error(message)
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  const openDrawer = React.useCallback((userId, tab = "view") => {
    if (userId === null || typeof userId === "undefined") {
      return
    }

    setDrawerState({ userId, tab })
  }, [])

  const handleDrawerOpenChange = React.useCallback((userId, nextOpen) => {
    setDrawerState((previous) => {
      if (nextOpen) {
        const nextTab = previous.userId === userId ? previous.tab : "view"
        return { userId, tab: nextTab }
      }

      if (previous.userId === userId) {
        return { userId: null, tab: "view" }
      }

      return previous
    })
  }, [])

  const handleEditUser = React.useCallback(
    (userId) => {
      openDrawer(userId, "edit")
    },
    [openDrawer]
  )

  const handleSuspendUser = React.useCallback(
    (user) => {
      if (!user?.id || typeof onUpdate !== "function") {
        return
      }

      const label = user.fullName || user.email || "user"
      const result = Promise.resolve(
        onUpdate(user.id, {
          status: "SUSPENDED",
        })
      )

      toast.promise(result, {
        loading: `Suspending ${label}`,
        success: `${label} suspended`,
        error: `Unable to suspend ${label}`,
      })
    },
    [onUpdate]
  )

  const handleActivateUser = React.useCallback(
    (user) => {
      if (!user?.id || typeof onUpdate !== "function") {
        return
      }

      const label = user.fullName || user.email || "user"
      const result = Promise.resolve(
        onUpdate(user.id, {
          status: "ACTIVE",
        })
      )

      toast.promise(result, {
        loading: `Activating ${label}`,
        success: `${label} activated`,
        error: `Unable to activate ${label}`,
      })
    },
    [onUpdate]
  )

  React.useEffect(() => {
    setData(users ?? [])
  }, [users])

  const auditColumns = React.useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        meta: {
          columnLabel: "Timestamp",
          headerClassName: "w-48",
          cellClassName: "align-top",
        },
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </div>
        ),
      },
      {
        id: "event",
        header: "Event",
        meta: {
          columnLabel: "Event",
          cellClassName: "align-top",
        },
        cell: ({ row }) => {
          const { action, model, recordId, userId, ip, userAgent } = row.original
          const primaryDetails = [model, recordId ? `Record ${recordId}` : null].filter(Boolean)
          const secondaryDetails = [
            userId ? `Actor ${userId}` : null,
            ip ? `IP ${ip}` : null,
          ].filter(Boolean)

          return (
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{action ?? "—"}</span>
              {primaryDetails.length ? (
                <span className="text-muted-foreground">{primaryDetails.join(" • ")}</span>
              ) : null}
              {secondaryDetails.length ? (
                <span className="text-muted-foreground text-xs">
                  {secondaryDetails.join(" • ")}
                </span>
              ) : null}
              {userAgent ? (
                <span className="text-muted-foreground text-xs break-words">{userAgent}</span>
              ) : null}
            </div>
          )
        },
      },
      {
        id: "before",
        header: "Before",
        meta: {
          columnLabel: "Before",
          cellClassName: "align-top",
        },
        cell: ({ row }) => {
          const formatted = formatAuditSnapshot(row.original.before)

          return formatted ? (
            <pre className="bg-muted/40 text-xs text-muted-foreground whitespace-pre-wrap break-words rounded-md p-2 max-h-40 overflow-auto">
              {formatted}
            </pre>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )
        },
      },
      {
        id: "after",
        header: "After",
        meta: {
          columnLabel: "After",
          cellClassName: "align-top",
        },
        cell: ({ row }) => {
          const formatted = formatAuditSnapshot(row.original.after)

          return formatted ? (
            <pre className="bg-muted/40 text-xs text-muted-foreground whitespace-pre-wrap break-words rounded-md p-2 max-h-40 overflow-auto">
              {formatted}
            </pre>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )
        },
      },
    ],
    []
  )

  const columns = React.useMemo(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.id} />,
      },
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "fullName",
        header: "User",
        meta: {
          columnLabel: "User",
        },
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true

          const searchValue = `${filterValue}`.toLowerCase()
          const fullName = `${row.original.fullName ?? ""}`.toLowerCase()
          const email = `${row.original.email ?? ""}`.toLowerCase()
          return `${fullName} ${email}`.includes(searchValue)
        },
        cell: ({ row }) => (
          <UserTableDrawerCellViewer
            item={row.original}
            availableRoles={availableRoles}
            onUpdate={onUpdate}
            openUserId={drawerState.userId}
            activeDrawerTab={drawerState.tab}
            onDrawerOpenChange={handleDrawerOpenChange}
          />
        ),
        enableHiding: false,
      },
      {
        accessorKey: "email",
        header: "Email",
        meta: { columnLabel: "Email" },
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.email ? (
              <span className="text-muted-foreground">{row.original.email}</span>
            ) : (
              "—"
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        meta: { columnLabel: "Status" },
        filterFn: (row, columnId, filterValue) =>
          !filterValue || `${row.getValue(columnId) ?? ""}` === filterValue,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={STATUS_BADGE_STYLES[row.original.status] ?? "text-muted-foreground px-1.5"}>
            {STATUS_LABELS[row.original.status] ?? row.original.status ?? "—"}
          </Badge>
        ),
      },
      {
        accessorKey: "roles",
        header: "Roles",
        meta: { columnLabel: "Roles" },
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true
          const roles = row.original.roles ?? []
          return roles.some((role) => `${role.id}` === filterValue || role.name === filterValue)
        },
        cell: ({ row }) => <RoleBadge roles={row.original.roles ?? []} />,
      },
      {
        accessorKey: "lastLoginAt",
        header: "Last login",
        meta: {
          columnLabel: "Last login",
          headerClassName: "text-right",
          headerAlign: "right",
          cellClassName: "text-right",
        },
        cell: ({ row }) => (
          <div className="text-right text-sm">{formatDate(row.original.lastLoginAt)}</div>
        ),
      },
      {
        accessorKey: "emailVerifiedAt",
        header: "Verified",
        meta: {
          columnLabel: "Verified",
          headerClassName: "text-right",
          headerAlign: "right",
          cellClassName: "text-right",
        },
        cell: ({ row }) => (
          <div className="flex justify-end">
            {row.original.emailVerifiedAt ? (
              <span className="inline-flex items-center text-success">
                <IconCircleCheckFilled className="text-success size-4" aria-hidden="true" />
                <span className="sr-only">Verified</span>
              </span>
            ) : (
              <span className="inline-flex items-center text-muted-foreground">
                <IconCircleXFilled className="size-4" aria-hidden="true" />
                <span className="sr-only">Not verified</span>
              </span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const user = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                  size="icon">
                  <IconDotsVertical />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onSelect={() => handleEditUser(user.id)}>
                  Edit profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant={user.status === "ACTIVE" ? "destructive" : undefined}
                  onSelect={() => {
                    if (user.status === "ACTIVE") {
                      handleSuspendUser(user)
                      return
                    }
                    handleActivateUser(user)
                  }}>
                  {user.status === "ACTIVE" ? "Suspend" : "Activate"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [
      availableRoles,
      onUpdate,
      drawerState.userId,
      drawerState.tab,
      handleDrawerOpenChange,
      handleEditUser,
      handleSuspendUser,
      handleActivateUser,
    ]
  )

  const roleOptions = React.useMemo(
    () => (availableRoles ?? []).map((role) => ({ id: `${role.id}`, name: role.name })),
    [availableRoles]
  )

  const hasActiveFilters = React.useMemo(
    () => (searchTerm?.trim() ?? "") !== "" || statusFilter !== "all" || roleFilter !== "all",
    [searchTerm, statusFilter, roleFilter]
  )

  return (
    <Card className="flex h-full flex-col">
      <Tabs value={activeView} onValueChange={setActiveView} className="flex h-full flex-col">
        <UserTableHeader activeView={activeView} onViewChange={setActiveView} />
        <CardContent className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          {/* USERS TAB */}
          <TabsContent value="users" className="mt-0 flex flex-col gap-4">
            <SharedDataTable
              columns={columns}
              data={data}
              className="flex flex-col gap-4"
              enableRowReorder
              enableRowSelection
              enablePagination
              onDataChange={setData}
              stickyHeader
              isLoading={tableIsLoading}
              error={error}
              renderHeader={({ table }) => (
                <UserTableToolbar
                  table={table}
                  searchTerm={searchTerm}
                  statusFilter={statusFilter}
                  roleFilter={roleFilter}
                  statusOptions={STATUS_LABELS}
                  roleOptions={roleOptions}
                  hasActiveFilters={hasActiveFilters}
                  onSearchChange={(value) => {
                    setSearchTerm(value)
                    table.getColumn("fullName")?.setFilterValue(value || undefined)
                  }}
                  onStatusFilterChange={(value) => {
                    setStatusFilter(value)
                    table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)
                  }}
                  onRoleFilterChange={(value) => {
                    setRoleFilter(value)
                    table.getColumn("roles")?.setFilterValue(value === "all" ? undefined : value)
                  }}
                  onClearFilters={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setRoleFilter("all")
                    table.getColumn("fullName")?.setFilterValue(undefined)
                    table.getColumn("status")?.setFilterValue(undefined)
                    table.getColumn("roles")?.setFilterValue(undefined)
                  }}
                  onRefresh={typeof onRefresh === "function" ? handleRefresh : undefined}
                  isLoading={tableIsLoading}
                />
              )}
              emptyMessage="No users found."
              onRefresh={handleRefresh}
            />
          </TabsContent>

          {/* AUDIT TAB */}
          <TabsContent value="audit" className="mt-0 flex flex-col">
            <SharedDataTable
              title="Auth user audit trail"
              description="Review recent changes captured for account updates."
              columns={auditColumns}
              data={auditLogs}
              className="flex flex-1 flex-col"
              isLoading={isLoadingAuditLogs}
              error={auditLogsError}
              emptyMessage="No audit activity recorded for AuthUser yet."
              onRefresh={refreshAuditLogs}
              enablePagination
              stickyHeader
              skeletonRowCount={4}
              getRowId={(row, index) =>
                row?.id ? `${row.id}` : `${row?.createdAt ?? "audit"}-${index}`
              }
            />
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports" className="mt-0 flex flex-col">
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
              Reports and exports will be available in a future update.
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
