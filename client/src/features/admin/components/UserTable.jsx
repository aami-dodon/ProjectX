import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import {
  IconChevronDown,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconRefresh,
  IconFilterX,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { z } from "zod"

import {
  DataTable as SharedDataTable,
  DataTableRowDrawer,
} from "@/shared/components/data-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Checkbox } from "@/shared/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Separator } from "@/shared/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs"

const STATUS_LABELS = {
  ACTIVE: "Active",
  PENDING_VERIFICATION: "Pending verification",
  INVITED: "Invited",
  SUSPENDED: "Suspended",
}

const STATUS_BADGE_STYLES = {
  ACTIVE:
    "bg-emerald-100 text-emerald-700 border-emerald-200 px-1.5 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  PENDING_VERIFICATION:
    "bg-amber-100 text-amber-700 border-amber-200 px-1.5 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  INVITED:
    "bg-blue-100 text-blue-700 border-blue-200 px-1.5 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
  SUSPENDED:
    "bg-rose-100 text-rose-700 border-rose-200 px-1.5 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
}

export const schema = z.object({
  id: z.union([z.string(), z.number()]),
  fullName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  avatarObjectName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  roles: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  mfaEnabled: z.boolean().nullable().optional(),
  emailVerifiedAt: z.string().nullable().optional(),
})

function formatDate(value) {
  if (!value) {
    return "—"
  }

  try {
    const date = new Date(value)
    return date.toLocaleString()
  } catch {
    return "—"
  }
}

function getInitials(value) {
  if (!value) {
    return "PX"
  }

  const trimmed = `${value}`.trim()
  if (!trimmed) {
    return "PX"
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return initials || "PX"
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

function RoleBadge({ roles = [] }) {
  if (!roles.length) {
    return <span className="text-muted-foreground text-xs">—</span>
  }

  if (roles.length === 1) {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
        {roles[0]?.name ?? "—"}
      </Badge>
    )
  }

  const [first, second, ...rest] = roles
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[first, second]
        .filter(Boolean)
        .map((role) => (
          <Badge key={role.id} variant="outline" className="text-muted-foreground px-1.5 text-xs">
            {role.name}
          </Badge>
        ))}
      {rest.length ? (
        <Badge variant="outline" className="text-muted-foreground px-1.5 text-xs">
          +{rest.length}
        </Badge>
      ) : null}
    </div>
  )
}

export function TableCellViewer({
  item,
  availableRoles,
  onUpdate,
  open,
  onOpenChange,
  defaultTab,
}) {
  const parsedUser = React.useMemo(() => schema.parse(item), [item])
  const formId = React.useMemo(
    () => (parsedUser?.id ? `user-${parsedUser.id}-edit` : "user-edit"),
    [parsedUser?.id]
  )
  const [formState, setFormState] = React.useState({
    fullName: parsedUser.fullName ?? "",
    email: parsedUser.email ?? "",
    status: parsedUser.status ?? "ACTIVE",
    roleIds: (parsedUser.roles ?? []).map((role) => `${role.id}`),
  })
  const [isVerifying, setIsVerifying] = React.useState(false)

  React.useEffect(() => {
    setFormState({
      fullName: parsedUser.fullName ?? "",
      email: parsedUser.email ?? "",
      status: parsedUser.status ?? "ACTIVE",
      roleIds: (parsedUser.roles ?? []).map((role) => `${role.id}`),
    })
    setIsVerifying(false)
  }, [parsedUser.fullName, parsedUser.email, parsedUser.status, parsedUser.roles, parsedUser.id])

  const handleVerifyEmail = React.useCallback(
    (user = parsedUser) => {
      if (!user?.id || typeof onUpdate !== "function") {
        return
      }

      const label = user.fullName || user.email || "user"
      setIsVerifying(true)
      const result = Promise.resolve(onUpdate(user.id, { verifyEmail: true }))

      toast.promise(result, {
        loading: `Verifying ${label}`,
        success: "Email marked as verified",
        error: "Unable to verify email",
      })

      result.finally(() => {
        setIsVerifying(false)
      })
    },
    [onUpdate, parsedUser]
  )

  const handleRoleToggle = React.useCallback((roleId, checked) => {
    setFormState((previous) => {
      const nextRoleIds = checked
        ? Array.from(new Set([...previous.roleIds, roleId]))
        : previous.roleIds.filter((value) => value !== roleId)

      return {
        ...previous,
        roleIds: nextRoleIds,
      }
    })
  }, [])

  const handleSubmit = React.useCallback(
    (event) => {
      event.preventDefault()

      const payload = {
        fullName: formState.fullName,
        email: formState.email,
        status: formState.status,
        roleIds: formState.roleIds,
      }

      const label = parsedUser.fullName || parsedUser.email || "user"
      const result =
        typeof onUpdate === "function"
          ? Promise.resolve(onUpdate(parsedUser.id, payload))
          : new Promise((resolve) => setTimeout(resolve, 1000))

      toast.promise(result, {
        loading: `Saving ${label}`,
        success: "Changes saved",
        error: "Unable to save changes",
      })
    },
    [formState.fullName, formState.email, formState.status, formState.roleIds, onUpdate, parsedUser]
  )

  const normalizedRoles = React.useMemo(
    () => (availableRoles ?? []).map((role) => ({ ...role, id: `${role.id}` })),
    [availableRoles]
  )

  return (
    <DataTableRowDrawer
      item={parsedUser}
      trigger={
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          <span className="block font-medium leading-tight">
            {parsedUser.fullName || parsedUser.email || "—"}
          </span>
        </Button>
      }
      open={open}
      onOpenChange={onOpenChange}
      defaultTab={defaultTab}
      headerActions={({ item }) =>
        item?.email && !item.emailVerifiedAt
          ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleVerifyEmail(item)}
                disabled={isVerifying}>
                <IconCircleCheckFilled className="mr-2 size-4" />
                Verify email
              </Button>
            )
          : null
      }
      headerClassName="gap-4 border-b px-4 py-4 text-left"
      renderHeader={({ item: current, headerActions }) => {
        const displayName = current?.fullName || current?.email || "User"
        const initials = getInitials(current?.fullName || current?.email)
        const avatarSrc = current?.avatarUrl ?? current?.avatar ?? undefined

        return (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <Avatar className="border-border size-16 border">
                  <AvatarImage src={avatarSrc} alt={`${displayName} avatar`} />
                  <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <Badge
                  variant="outline"
                  className={
                    STATUS_BADGE_STYLES[current?.status] || "text-muted-foreground px-1.5"
                  }>
                  {STATUS_LABELS[current?.status] ?? current?.status ?? "—"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-base font-semibold leading-tight">{displayName}</p>
                  {current?.email ? (
                    <p className="text-muted-foreground text-sm">{current.email}</p>
                  ) : null}
                </div>
                {current?.emailVerifiedAt ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-300">
                    <IconCircleCheckFilled className="text-emerald-500 size-4" />
                    Verified
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm font-medium">Not verified</div>
                )}
              </div>
            </div>
            {headerActions ? (
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                {headerActions}
              </div>
            ) : null}
          </div>
        )
      }}
      direction="right"
      mobileDirection="bottom"
      renderView={({ item: current }) => {
        const mfaStatus =
          current?.mfaEnabled === true
            ? "Enabled"
            : current?.mfaEnabled === false
              ? "Disabled"
              : "—"

        return (
          <div className="flex flex-col gap-6 text-sm">
            <dl className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</dt>
                <dd className="font-medium">{formatDate(current?.createdAt)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last updated</dt>
                <dd className="font-medium">{formatDate(current?.updatedAt)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last login</dt>
                <dd className="font-medium">{formatDate(current?.lastLoginAt)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">MFA</dt>
                <dd className="font-medium">{mfaStatus}</dd>
              </div>
              <div className="space-y-1 md:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</dt>
                <dd>
                  <RoleBadge roles={current?.roles ?? []} />
                </dd>
              </div>
            </dl>
          </div>
        )
      }}
      renderEdit={() => (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3 sm:col-span-2">
              <Label htmlFor={`${formId}-full-name`}>Full name</Label>
              <Input
                id={`${formId}-full-name`}
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor={`${formId}-email`}>Email</Label>
              <div className="flex flex-col gap-2">
                <Input
                  id={`${formId}-email`}
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  placeholder="name@example.com"
                  autoComplete="off"
                />
                <p className="text-muted-foreground text-xs">
                  Updating the email resets verification until it is marked as verified.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor={`${formId}-status`}>Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  setFormState((previous) => ({
                    ...previous,
                    status: value,
                  }))
                }>
                <SelectTrigger id={`${formId}-status`} className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="flex flex-col gap-3">
            <Label>Roles</Label>
            <div className="space-y-2 rounded-md border p-3">
              {normalizedRoles.length ? (
                normalizedRoles.map((role) => {
                  const checked = formState.roleIds.includes(role.id)

                  return (
                    <label key={role.id} htmlFor={`${formId}-role-${role.id}`} className="flex items-start gap-2 text-sm">
                      <Checkbox
                        id={`${formId}-role-${role.id}`}
                        checked={checked}
                        onCheckedChange={(value) => handleRoleToggle(role.id, value === true)}
                      />
                      <span className="flex flex-1 flex-col">
                        <span className="font-medium leading-none">{role.name}</span>
                        {role.description ? (
                          <span className="text-muted-foreground text-xs">{role.description}</span>
                        ) : null}
                      </span>
                    </label>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No roles available for assignment.</p>
              )}
            </div>
          </div>
        </form>
      )}
      renderEditFooter={({ close }) => (
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" form={formId}>
            Submit
          </Button>
          <Button type="button" variant="outline" onClick={close}>
            Done
          </Button>
        </div>
      )}
    />
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
  const [activeView, setActiveView] = React.useState("outline")
  const [data, setData] = React.useState(() => users ?? [])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [drawerState, setDrawerState] = React.useState({ userId: null, tab: "view" })
  const [isRefreshing, setIsRefreshing] = React.useState(false)

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

  const handleDrawerOpenChange = React.useCallback(
    (userId) => (nextOpen) => {
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
    },
    []
  )

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
          if (!filterValue) {
            return true
          }

          const searchValue = `${filterValue}`.toLowerCase()
          const fullName = `${row.original.fullName ?? ""}`.toLowerCase()
          const email = `${row.original.email ?? ""}`.toLowerCase()

          return `${fullName} ${email}`.includes(searchValue)
        },
        cell: ({ row }) => (
          <TableCellViewer
            item={row.original}
            availableRoles={availableRoles}
            onUpdate={onUpdate}
            open={drawerState.userId === row.original.id}
            onOpenChange={handleDrawerOpenChange(row.original.id)}
            defaultTab={drawerState.userId === row.original.id ? drawerState.tab : "view"}
          />
        ),
        enableHiding: false,
      },
      {
        accessorKey: "email",
        header: "Email",
        meta: {
          columnLabel: "Email",
        },
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
        meta: {
          columnLabel: "Status",
        },
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) {
            return true
          }

          return `${row.getValue(columnId) ?? ""}` === filterValue
        },
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
        meta: {
          columnLabel: "Roles",
        },
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) {
            return true
          }

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
              <span className="inline-flex items-center text-emerald-500">
                <IconCircleCheckFilled className="size-4" aria-hidden="true" />
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
                <DropdownMenuItem
                  onSelect={() => {
                    handleEditUser(user.id)
                  }}>
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
    () =>
      (availableRoles ?? []).map((role) => ({
        id: `${role.id}`,
        name: role.name,
      })),
    [availableRoles]
  )

  const hasActiveFilters = React.useMemo(
    () =>
      (searchTerm?.trim() ?? "") !== "" ||
      statusFilter !== "all" ||
      roleFilter !== "all",
    [searchTerm, statusFilter, roleFilter]
  )

  return (
    <Card className="flex h-full flex-col">
      <Tabs value={activeView} onValueChange={setActiveView} className="flex h-full flex-col">
        <CardHeader className="flex flex-col gap-6 border-b border-border pb-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">User directory</CardTitle>
            <CardDescription>
              Manage accounts, adjust roles, and review verification status across the organisation.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 @4xl/main:flex-row @4xl/main:items-center @4xl/main:justify-between">
            <div className="flex flex-col gap-2 @4xl/main:hidden">
              <Label htmlFor="view-selector" className="sr-only">
                View
              </Label>
              <Select value={activeView} onValueChange={setActiveView}>
                <SelectTrigger className="w-full" id="view-selector" size="sm">
                  <SelectValue placeholder="Select a view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outline">Users</SelectItem>
                  <SelectItem value="past-performance">Audit</SelectItem>
                  <SelectItem value="key-personnel">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TabsList className="hidden **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 self-start @4xl/main:flex">
              <TabsTrigger value="outline">Users</TabsTrigger>
              <TabsTrigger value="past-performance">Audit</TabsTrigger>
              <TabsTrigger value="key-personnel">Reports</TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          <TabsContent value="outline" className="mt-0 flex flex-col gap-4">
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
              renderHeader={({ table }) => ({
                leading: (
                  <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
                    <Input
                      placeholder="Search by name or email"
                      className="w-full lg:w-72"
                      value={searchTerm}
                      onChange={(event) => {
                        const value = event.target.value
                        setSearchTerm(value)
                        table.getColumn("fullName")?.setFilterValue(value || undefined)
                      }}
                    />
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setStatusFilter(value)
                          table
                            .getColumn("status")
                            ?.setFilterValue(value === "all" ? undefined : value)
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={roleFilter}
                        onValueChange={(value) => {
                          setRoleFilter(value)
                          table
                            .getColumn("roles")
                            ?.setFilterValue(value === "all" ? undefined : value)
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All roles</SelectItem>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full gap-2 sm:w-auto"
                        disabled={!hasActiveFilters}
                        onClick={() => {
                          setSearchTerm("")
                          setStatusFilter("all")
                          setRoleFilter("all")
                          table.getColumn("fullName")?.setFilterValue(undefined)
                          table.getColumn("status")?.setFilterValue(undefined)
                          table.getColumn("roles")?.setFilterValue(undefined)
                        }}
                      >
                        <IconFilterX className="size-4" aria-hidden="true" />
                        <span>Clear filters</span>
                      </Button>
                    </div>
                  </div>
                ),
                trailing: (
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <IconLayoutColumns />
                          <span className="hidden lg:inline">Customize Columns</span>
                          <span className="lg:hidden">Columns</span>
                          <IconChevronDown />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {table
                          .getAllColumns()
                          .filter(
                            (column) => typeof column.accessorFn !== "undefined" && column.getCanHide()
                          )
                          .map((column) => {
                            const label =
                              column.columnDef?.meta?.columnLabel ??
                              (typeof column.columnDef?.header === "string"
                                ? column.columnDef.header
                                : column.id)

                            return (
                              <DropdownMenuCheckboxItem
                                key={column.id}
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                              >
                                {label}
                              </DropdownMenuCheckboxItem>
                            )
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {typeof onRefresh === "function" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={tableIsLoading}
                        aria-label="Refresh table"
                      >
                        <IconRefresh className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                ),
              })}
              emptyMessage="No users found."
              onRefresh={handleRefresh}
            />
          </TabsContent>
          <TabsContent value="past-performance" className="mt-0 flex flex-col">
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
              Audit insights are coming soon.
            </div>
          </TabsContent>
          <TabsContent value="key-personnel" className="mt-0 flex flex-col">
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
              Reports and exports will be available in a future update.
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
