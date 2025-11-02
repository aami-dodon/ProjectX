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
import { TabsContent } from "@/shared/components/ui/tabs"

import { UserTableToolbar } from "../user-table/UserTableToolbar"
import {
  TableCellViewer as UserTableDrawerCellViewer,
  STATUS_BADGE_STYLES,
  STATUS_LABELS,
  RoleBadge,
  formatDate,
} from "../user-table/UserTableDrawer"

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
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

export function UsersTab({
  users = [],
  availableRoles = [],
  isLoading = false,
  error,
  onUpdate,
  onRefresh,
  pagination,
  searchTerm = "",
  statusFilter = null,
  roleFilter = null,
  sort = null,
  onSearchChange,
  onStatusFilterChange,
  onRoleFilterChange,
  onPaginationChange,
  onPageSizeChange,
  onSortChange,
  onClearFilters,
}) {
  const [data, setData] = React.useState(() => users ?? [])
  const [searchInput, setSearchInput] = React.useState(searchTerm ?? "")
  const [drawerState, setDrawerState] = React.useState({ userId: null, tab: "view" })
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [sortingState, setSortingState] = React.useState([])

  const tableIsLoading = isLoading || isRefreshing

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

  React.useEffect(() => {
    setSearchInput(searchTerm ?? "")
  }, [searchTerm])

  React.useEffect(() => {
    if (!sort?.field) {
      setSortingState([])
      return
    }

    const sortFieldMap = {
      name: "fullName",
      email: "email",
      status: "status",
      lastLoginAt: "lastLoginAt",
      emailVerifiedAt: "emailVerifiedAt",
    }
    const columnId = Object.entries(sortFieldMap).find(([, value]) => value === sort.field)?.[0]

    if (!columnId) {
      setSortingState([])
      return
    }

    setSortingState([{ id: columnId, desc: sort.direction !== "asc" }])
  }, [sort])

  React.useEffect(() => {
    if (!onSearchChange) {
      return
    }

    const handler = setTimeout(() => {
      const trimmed = searchInput?.trim?.() ?? ""
      if (trimmed === (searchTerm?.trim?.() ?? "")) {
        return
      }
      onSearchChange(trimmed)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchInput, searchTerm, onSearchChange])

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
          sortField: "name",
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
        meta: { columnLabel: "Email", sortField: "email" },
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
        meta: { columnLabel: "Status", sortField: "status" },
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={STATUS_BADGE_STYLES[row.original.status] ?? "text-muted-foreground px-1.5"}
          >
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
          sortField: "lastLoginAt",
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
                  size="icon"
                >
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
                  }}
                >
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

  const hasActiveFilters = React.useMemo(() => {
    const trimmedSearch = searchTerm?.trim?.() ?? ""
    const resolvedStatus = statusFilter ?? "all"
    const resolvedRole = roleFilter ?? "all"
    return trimmedSearch !== "" || resolvedStatus !== "all" || resolvedRole !== "all"
  }, [searchTerm, statusFilter, roleFilter])

  const resolvedStatusFilter = statusFilter ?? "all"
  const resolvedRoleFilter = roleFilter ?? "all"

  const handleSortingChange = React.useCallback(
    (updater) => {
      setSortingState((previous) => {
        const nextState = typeof updater === "function" ? updater(previous) : updater ?? []
        const [nextSort] = nextState

        if (typeof onSortChange === "function") {
          if (!nextSort) {
            onSortChange(null)
          } else {
            const sortFieldMap = {
              fullName: "name",
              email: "email",
              status: "status",
              lastLoginAt: "lastLoginAt",
              emailVerifiedAt: "emailVerifiedAt",
            }
            const nextField = sortFieldMap[nextSort.id] ?? nextSort.id
            onSortChange({ field: nextField, direction: nextSort.desc ? "desc" : "asc" })
          }
        }

        return nextState
      })
    },
    [onSortChange]
  )

  const handlePaginationChange = React.useCallback(
    (next) => {
      if (!next) {
        return
      }

      const nextPageSize = next.pageSize ?? pagination?.pageSize ?? 10
      const nextPageIndex = next.pageIndex ?? 0
      const nextPage = nextPageIndex + 1

      if (typeof onPageSizeChange === "function" && nextPageSize !== pagination?.pageSize) {
        onPageSizeChange(nextPageSize)
        return
      }

      if (typeof onPaginationChange === "function" && nextPage !== (pagination?.page ?? 1)) {
        onPaginationChange(nextPage)
      }
    },
    [onPaginationChange, onPageSizeChange, pagination]
  )

  return (
    <TabsContent value="users" className="mt-0 flex flex-col gap-4">
      <SharedDataTable
        columns={columns}
        data={data}
        className="flex flex-col gap-4"
        enableRowReorder
        enableRowSelection
        enablePagination
        manualPagination
        manualSorting
        manualFiltering
        onDataChange={setData}
        stickyHeader
        isLoading={tableIsLoading}
        error={error}
        totalItems={pagination?.total ?? 0}
        paginationState={{
          pageIndex: Math.max(0, (pagination?.page ?? 1) - 1),
          pageSize: pagination?.pageSize ?? 10,
        }}
        pageCount={Math.max(
          1,
          Math.ceil((pagination?.total ?? 0) / Math.max(pagination?.pageSize ?? 10, 1))
        )}
        sortingState={sortingState}
        onSortingChange={handleSortingChange}
        onPaginationChange={handlePaginationChange}
        renderHeader={({ table }) => (
          <UserTableToolbar
            table={table}
            searchTerm={searchInput}
            statusFilter={resolvedStatusFilter}
            roleFilter={resolvedRoleFilter}
            statusOptions={STATUS_LABELS}
            roleOptions={roleOptions}
            hasActiveFilters={hasActiveFilters}
            onSearchChange={setSearchInput}
            onStatusFilterChange={(value) => {
              const nextValue = value === "all" ? null : value
              onStatusFilterChange?.(nextValue)
            }}
            onRoleFilterChange={(value) => {
              const nextValue = value === "all" ? null : value
              onRoleFilterChange?.(nextValue)
            }}
            onClearFilters={() => {
              setSearchInput("")
              onClearFilters?.()
              onStatusFilterChange?.(null)
              onRoleFilterChange?.(null)
            }}
            onRefresh={typeof onRefresh === "function" ? handleRefresh : undefined}
            isLoading={tableIsLoading}
          />
        )}
        emptyMessage="No users found."
        onRefresh={handleRefresh}
      />
    </TabsContent>
  )
}
