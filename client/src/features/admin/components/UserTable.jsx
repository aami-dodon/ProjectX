import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
  IconTrendingUp,
} from "@tabler/icons-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/ui/chart";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

const STATUS_LABELS = {
  ACTIVE: "Active",
  PENDING_VERIFICATION: "Pending verification",
  INVITED: "Invited",
  SUSPENDED: "Suspended",
};

const STATUS_BADGE_STYLES = {
  ACTIVE:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  PENDING_VERIFICATION:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  INVITED:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
  SUSPENDED:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
};

const userSchema = z.object({
  id: z.union([z.string(), z.number()]),
  fullName: z.string().optional(),
  email: z.string().optional(),
  status: z.string().optional(),
  roles: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        name: z.string(),
      })
    )
    .optional(),
  lastLoginAt: z.string().nullable().optional(),
  emailVerifiedAt: z.string().nullable().optional(),
});

function formatDate(value) {
  if (!value) {
    return "—";
  }

  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch {
    return "—";
  }
}

function DragHandle({ id }) {
  const { attributes, listeners } = useSortable({
    id,
  });

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
  );
}

function RoleBadge({ roles = [] }) {
  if (!roles.length) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  if (roles.length === 1) {
    return (
      <Badge variant="outline" className="px-2 py-0.5 text-xs">
        {roles[0]?.name ?? "—"}
      </Badge>
    );
  }

  const [first, second, ...rest] = roles;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[first, second]
        .filter(Boolean)
        .map((role) => (
          <Badge key={role.id} variant="outline" className="px-2 py-0.5 text-xs">
            {role.name}
          </Badge>
        ))}
      {rest.length ? (
        <Badge variant="outline" className="px-2 py-0.5 text-xs">
          +{rest.length}
        </Badge>
      ) : null}
    </div>
  );
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
};

function UserDetailDrawer({ user, availableRoles, onUpdate, onEdit }) {
  const parsedUser = userSchema.parse(user);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    fullName: parsedUser.fullName ?? "",
    status: parsedUser.status ?? "ACTIVE",
    roleIds: (parsedUser.roles ?? []).map((role) => `${role.id}`),
  });
  const [error, setError] = useState("");

  const normalizedRoles = useMemo(
    () => (availableRoles ?? []).map((role) => ({ ...role, id: `${role.id}` })),
    [availableRoles]
  );

  useEffect(() => {
    if (open) {
      setFormState({
        fullName: parsedUser.fullName ?? "",
        status: parsedUser.status ?? "ACTIVE",
        roleIds: (parsedUser.roles ?? []).map((role) => `${role.id}`),
      });
      setError("");
      if (typeof onEdit === "function") {
        onEdit(parsedUser.id);
      }
    }
  }, [open, parsedUser, onEdit]);

  const handleRoleToggle = useCallback((roleId, checked) => {
    setFormState((prev) => {
      const nextRoleIds = checked
        ? Array.from(new Set([...prev.roleIds, roleId]))
        : prev.roleIds.filter((id) => id !== roleId);
      return {
        ...prev,
        roleIds: nextRoleIds,
      };
    });
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (typeof onUpdate !== "function") {
        setOpen(false);
        return;
      }

      setSubmitting(true);
      setError("");

      try {
        await onUpdate(parsedUser.id, {
          fullName: formState.fullName,
          status: formState.status,
          roleIds: formState.roleIds,
        });
        toast.success("User updated", {
          description: `${parsedUser.email ?? "User"} has been updated successfully`,
        });
        setOpen(false);
      } catch (err) {
        const message = err?.message ?? "Unable to update the user";
        toast.error("Update failed", { description: message });
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [formState.fullName, formState.status, formState.roleIds, onUpdate, parsedUser]
  );

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground flex w-full flex-col items-start gap-1 px-0 py-1 text-left">
          <span className="font-medium leading-tight">
            {parsedUser.fullName || parsedUser.email || "—"}
          </span>
          <span className="text-muted-foreground text-xs">
            {parsedUser.email ?? "—"}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-full max-h-[85vh] w-full overflow-hidden border-l bg-background shadow-xl sm:max-w-xl">
        <DrawerHeader className="border-b px-6 py-6 text-left">
          <DrawerTitle>{parsedUser.fullName || parsedUser.email || "User details"}</DrawerTitle>
          {parsedUser.email ? <DrawerDescription>{parsedUser.email}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm">
          {!isMobile ? (
            <div className="mb-6 space-y-4">
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm font-medium leading-none">
                  Trending up by 5.2% this month <IconTrendingUp className="size-4" />
                </div>
                <p className="text-muted-foreground">
                  Showing sign-in activity for the last 6 months. Use this information to understand engagement trends for this
                  user.
                </p>
              </div>
              <Separator />
            </div>
          ) : null}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-1 capitalize",
                    STATUS_BADGE_STYLES[parsedUser.status] ?? ""
                  )}
                >
                  {STATUS_LABELS[parsedUser.status] ?? parsedUser.status ?? "—"}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verified</p>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  {parsedUser.emailVerifiedAt ? (
                    <>
                      <IconCircleCheckFilled className="text-emerald-500 size-4" />
                      Verified
                    </>
                  ) : (
                    <span className="text-muted-foreground">Not verified</span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last login</p>
              <p className="mt-1 text-sm text-foreground">{formatDate(parsedUser.lastLoginAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</p>
              <RoleBadge roles={parsedUser.roles ?? []} />
            </div>
          </div>
          <Separator className="my-6" />
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3">
              <Label htmlFor={`fullName-${parsedUser.id}`}>Full name</Label>
              <Input
                id={`fullName-${parsedUser.id}`}
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, fullName: event.target.value }))
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor={`status-${parsedUser.id}`}>Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger id={`status-${parsedUser.id}`} className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_LABELS).map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor={`last-login-${parsedUser.id}`}>Last login</Label>
                <Input
                  id={`last-login-${parsedUser.id}`}
                  value={formatDate(parsedUser.lastLoginAt)}
                  disabled
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label>Roles</Label>
              <div className="space-y-2 rounded-md border p-3">
                {normalizedRoles.length ? (
                  normalizedRoles.map((role) => {
                    const roleId = `${role.id}`;
                    const checked = formState.roleIds.includes(roleId);

                    return (
                      <label key={roleId} htmlFor={`role-${parsedUser.id}-${roleId}`} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          id={`role-${parsedUser.id}-${roleId}`}
                          checked={checked}
                          onCheckedChange={(value) =>
                            handleRoleToggle(roleId, value === true)
                          }
                        />
                        <span className="flex flex-1 flex-col">
                          <span className="font-medium leading-none">{role.name}</span>
                          {role.description ? (
                            <span className="text-muted-foreground text-xs">
                              {role.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No roles available for assignment.</p>
                )}
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex items-center justify-end gap-2">
              <DrawerClose asChild>
                <Button type="button" variant="ghost" disabled={submitting}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DraggableRow({ row }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className={cell.column.columnDef?.meta?.className}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function UserTable({
  users = [],
  availableRoles = [],
  isLoading = false,
  error,
  onRefresh,
  onUpdate,
  onEdit,
  onSuspend,
  onMakeCopy,
  onSelectionChange,
}) {
  const [data, setData] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const normalizedUsers = useMemo(
    () =>
      (users ?? []).map((user) => ({
        ...user,
        roles: (user.roles ?? []).map((role) => ({ ...role, id: role.id ?? role.name })),
      })),
    [users]
  );

  useEffect(() => {
    setData(normalizedUsers);
  }, [normalizedUsers]);

  const dataIds = useMemo(
    () => data.map((item) => `${item.id ?? item.email}`),
    [data]
  );

  const globalFilterFn = useCallback((row, _columnId, value) => {
    if (!value) {
      return true;
    }

    const search = String(value).toLowerCase();
    const { fullName, email } = row.original ?? {};

    return [fullName, email]
      .filter(Boolean)
      .some((item) => item.toLowerCase().includes(search));
  }, []);

  const columns = useMemo(
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
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
              aria-label={`Select ${row.original?.email ?? "user"}`}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
          className: "w-12 text-center",
        },
      },
      {
        accessorKey: "fullName",
        header: "User",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <UserDetailDrawer
              user={row.original}
              availableRoles={availableRoles}
              onUpdate={onUpdate}
              onEdit={onEdit}
            />
          </div>
        ),
        meta: {
          className: "min-w-[200px]",
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.email ?? "—"}</span>
        ),
        meta: {
          className: "min-w-[200px]",
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant="outline"
              className={cn("capitalize", STATUS_BADGE_STYLES[status] ?? "")}
            >
              {STATUS_LABELS[status] ?? status ?? "—"}
            </Badge>
          );
        },
        meta: {
          className: "w-40",
        },
      },
      {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) => <RoleBadge roles={row.original.roles ?? []} />,
        meta: {
          className: "min-w-[160px]",
        },
      },
      {
        accessorKey: "lastLoginAt",
        header: () => <div className="w-full text-right">Last login</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm text-muted-foreground">
            {formatDate(row.original.lastLoginAt)}
          </div>
        ),
        meta: {
          className: "w-40 text-right",
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
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
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  if (typeof onSuspend === "function") {
                    onSuspend(row.original.id);
                  }
                }}
              >
                Suspend
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  if (typeof onMakeCopy === "function") {
                    onMakeCopy(row.original.id);
                  }
                }}
              >
                Make a copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  toast.warning("Delete action", {
                    description: "Connect this option to your delete flow.",
                  });
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        meta: {
          className: "w-12",
        },
      },
    ],
    [availableRoles, onUpdate, onEdit, onSuspend, onMakeCopy]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
    getRowId: (row) => `${row.id ?? row.email}`,
    enableRowSelection: true,
    globalFilterFn,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    if (typeof onSelectionChange === "function") {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, table, onSelectionChange]);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!active || !over || active.id === over.id) {
        return;
      }

      setData((prev) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) {
          return prev;
        }
        return arrayMove(prev, oldIndex, newIndex);
      });
    },
    [dataIds]
  );

  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalUsers = data.length;
  const errorMessage = typeof error === "string" ? error : error?.message;

  return (
    <Tabs defaultValue="users" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="users">
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="users">Active users</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">
            Activity <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
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
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {onRefresh ? (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              <IconPlus />
              <span className="hidden lg:inline">Refresh</span>
              <span className="lg:hidden">Sync</span>
            </Button>
          ) : null}
        </div>
      </div>
      <TabsContent value="users" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-sm">
            <Label htmlFor="user-search" className="sr-only">
              Search users
            </Label>
            <div className="relative">
              <IconSearch className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                id="user-search"
                placeholder="Search by name or email"
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Badge variant="outline" className="bg-muted/60 text-xs font-medium">
            {filteredRowCount} of {totalUsers} users
          </Badge>
        </div>
        {errorMessage ? (
          <div className="text-destructive rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm">
            {errorMessage}
          </div>
        ) : null}
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan} className={header.column.columnDef?.meta?.className}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {isLoading && table.getRowModel().rows.length === 0 ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      {table.getVisibleFlatColumns().map((column) => (
                        <TableCell key={column.id} className={column.columnDef?.meta?.className}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {isLoading ? "Loading users…" : "No results."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {selectedCount} of {filteredRowCount} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="activity" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
      </TabsContent>
      <TabsContent value="reports" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed" />
      </TabsContent>
    </Tabs>
  );
}
