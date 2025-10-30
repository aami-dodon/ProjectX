import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import {
  IconChevronDown,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { z } from "zod"

import {
  DataTable as SharedDataTable,
  DataTableRowDrawer,
} from "@/shared/components/data-table"
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

export function TableCellViewer({ item, availableRoles, onUpdate }) {
  const parsedUser = React.useMemo(() => schema.parse(item), [item])
  const formId = React.useMemo(
    () => (parsedUser?.id ? `user-${parsedUser.id}-edit` : "user-edit"),
    [parsedUser?.id]
  )
  const [formState, setFormState] = React.useState({
    fullName: parsedUser.fullName ?? "",
    status: parsedUser.status ?? "ACTIVE",
    roleIds: (parsedUser.roles ?? []).map((role) => `${role.id}`),
  })

  React.useEffect(() => {
    setFormState({
      fullName: parsedUser.fullName ?? "",
      status: parsedUser.status ?? "ACTIVE",
      roleIds: (parsedUser.roles ?? []).map((role) => `${role.id}`),
    })
  }, [parsedUser.fullName, parsedUser.status, parsedUser.roles])

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
        success: "Done",
        error: "Error",
      })
    },
    [formState.fullName, formState.status, formState.roleIds, onUpdate, parsedUser]
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
          {parsedUser.email ? (
            <span className="text-muted-foreground block text-xs">{parsedUser.email}</span>
          ) : null}
        </Button>
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
        return (
          <div className="flex flex-col gap-6 text-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last login</p>
                <p className="font-medium">{formatDate(current?.lastLoginAt)}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</p>
                <RoleBadge roles={current?.roles ?? []} />
              </div>
            </div>
          </div>
        )
      }}
      renderEdit={() => (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="flex flex-col gap-3">
              <Label>Email</Label>
              <Input value={parsedUser.email ?? "—"} disabled />
            </div>
          </div>
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
}) {
  const [activeView, setActiveView] = React.useState("outline")
  const [data, setData] = React.useState(() => users ?? [])

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
        cell: ({ row }) => (
          <TableCellViewer item={row.original} availableRoles={availableRoles} onUpdate={onUpdate} />
        ),
        enableHiding: false,
      },
      {
        accessorKey: "status",
        header: "Status",
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
        cell: ({ row }) => <RoleBadge roles={row.original.roles ?? []} />,
      },
      {
        accessorKey: "lastLoginAt",
        header: () => <div className="w-full text-right">Last login</div>,
        cell: ({ row }) => <div className="text-right text-sm">{formatDate(row.original.lastLoginAt)}</div>,
      },
      {
        accessorKey: "emailVerifiedAt",
        header: () => <div className="w-full text-right">Verified</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">
            {row.original.emailVerifiedAt ? "Yes" : "No"}
          </div>
        ),
      },
      {
        id: "actions",
        cell: () => (
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
              <DropdownMenuItem>View profile</DropdownMenuItem>
              <DropdownMenuItem>Make a copy</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [availableRoles, onUpdate]
  )

  return (
    <Tabs value={activeView} onValueChange={setActiveView} className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeView} onValueChange={setActiveView}>
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="past-performance">Past Performance</SelectItem>
            <SelectItem value="key-personnel">Key Personnel</SelectItem>
            <SelectItem value="focus-documents">Focus Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <SharedDataTable
          columns={columns}
          data={data}
          className="flex flex-col gap-4"
          enableRowReorder
          enableRowSelection
          enablePagination
          onDataChange={setData}
          stickyHeader
          isLoading={isLoading}
          error={error}
          renderHeader={({ table }) => ({
            trailing: (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
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
                      .map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm">
                  <IconPlus />
                  <span className="hidden lg:inline">Add Section</span>
                </Button>
              </div>
            ),
          })}
          emptyMessage="No users found."
        />
      </TabsContent>
      <TabsContent value="past-performance" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="focus-documents" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}
