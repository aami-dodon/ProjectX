import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { CardDescription } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { DataTable, DataTableRowDrawer } from "@/shared/components/data-table";
import { cn } from "@/shared/lib/utils";
import { IconChevronDown, IconLayoutColumns } from "@tabler/icons-react";

const STATUS_LABELS = {
  ACTIVE: "Active",
  PENDING_VERIFICATION: "Pending verification",
  INVITED: "Invited",
  SUSPENDED: "Suspended",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

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

function UserEditDrawer({ open, onOpenChange, user, onSubmit, availableRoles = [] }) {
  const [formState, setFormState] = useState({
    fullName: "",
    status: "",
    tenantId: "",
    roleIds: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const formId = useMemo(
    () => (user?.id ? `user-${user.id}-edit` : "user-edit"),
    [user?.id]
  );

  useEffect(() => {
    if (user) {
      setFormState({
        fullName: user.fullName ?? "",
        status: user.status ?? "ACTIVE",
        tenantId: user.tenantId ?? "",
        roleIds: (user.roles ?? []).map((role) => role.id),
      });
      setError("");
    }
  }, [user]);

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
      if (!user) {
        return;
      }

      setSubmitting(true);
      setError("");

      try {
        await onSubmit(user.id, {
          fullName: formState.fullName,
          status: formState.status,
          tenantId: formState.tenantId,
          roleIds: formState.roleIds,
        });
        toast.success("User updated", {
          description: `${user.email} has been updated successfully`,
        });
        onOpenChange(false);
      } catch (err) {
        const message = err?.message ?? "Unable to update the user";
        toast.error("Update failed", { description: message });
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [
      formState.fullName,
      formState.status,
      formState.tenantId,
      formState.roleIds,
      onOpenChange,
      onSubmit,
      user,
    ]
  );

  return (
    <DataTableRowDrawer
      open={open}
      onOpenChange={onOpenChange}
      item={user}
      defaultTab="edit"
      title="Edit user"
      description={({ item: current }) =>
        current?.email ? <CardDescription>{current.email}</CardDescription> : null
      }
      renderView={({ item: current }) => (
        <div className="grid gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full name</p>
            <p className="text-base font-medium">{current?.fullName ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="font-medium">{current?.email ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
            <Badge
              variant="outline"
              className={cn("capitalize", STATUS_BADGE_STYLES[current?.status] ?? "")}
            >
              {STATUS_LABELS[current?.status] ?? current?.status ?? "—"}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</p>
            <p className="text-sm text-muted-foreground">
              {(current?.roles ?? []).map((role) => role.name).join(", ") || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tenant ID</p>
            <p className="font-medium">{current?.tenantId || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last login</p>
            <p className="font-medium">{formatDate(current?.lastLoginAt)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verified</p>
            <p className="font-medium">{current?.emailVerifiedAt ? "Yes" : "No"}</p>
          </div>
        </div>
      )}
      renderEdit={() => (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={formState.fullName}
              onChange={(event) => setFormState((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Enter full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantId">Tenant ID</Label>
            <Input
              id="tenantId"
              value={formState.tenantId}
              onChange={(event) => setFormState((prev) => ({ ...prev, tenantId: event.target.value }))}
              placeholder="Optional tenant identifier"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formState.status}
              onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="space-y-2 rounded-md border p-3">
              {availableRoles.length > 0 ? (
                availableRoles.map((role) => {
                  const checked = formState.roleIds.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      htmlFor={`role-${role.id}`}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={checked}
                        onCheckedChange={(value) => handleRoleToggle(role.id, value === true)}
                      />
                      <span className="flex flex-1 flex-col">
                        <span className="font-medium leading-none">{role.name}</span>
                        {role.description ? (
                          <span className="text-xs text-muted-foreground">{role.description}</span>
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
        </form>
      )}
      renderEditFooter={({ close }) => (
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setError("");
              close();
            }}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    />
  );
}

export function UserTable({
  users = [],
  availableRoles = [],
  isLoading = false,
  error,
  onRefresh,
  onUpdate,
}) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleEdit = useCallback((userId) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => <div className="font-medium">{row.original.fullName ?? "—"}</div>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.email}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("capitalize", STATUS_BADGE_STYLES[row.original.status] ?? "")}
          >
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: "roles",
        header: "Roles",
        cell: ({ row }) => (
          <p className="max-w-[220px] truncate text-sm text-muted-foreground">
            {(row.original.roles ?? []).map((role) => role.name).join(", ") || "—"}
          </p>
        ),
      },
      {
        accessorKey: "lastLoginAt",
        header: "Last login",
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.lastLoginAt)}</span>,
      },
      {
        id: "verified",
        header: "Verified",
        cell: ({ row }) =>
          row.original.emailVerifiedAt ? (
            <Badge variant="secondary">Yes</Badge>
          ) : (
            <Badge variant="outline">No</Badge>
          ),
      },
      {
        id: "actions",
        header: () => null,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerClassName: "w-0",
          cellClassName: "text-right",
        },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleEdit(row.original.id)}>
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [handleEdit]
  );

  const closeDrawer = useCallback(
    (open) => {
      setDrawerOpen(open);
      if (!open) {
        setSelectedUserId(null);
      }
    },
    []
  );

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [
    selectedUserId,
    users,
  ]);

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        error={error}
        emptyMessage="No users found"
        getRowId={(row) => row.id}
        className="px-4 lg:px-6"
        stickyHeader
        renderHeader={({ table }) => ({
          leading: (
            <div className="space-y-1">
              <h2 className="text-lg font-semibold leading-tight">User management</h2>
              <p className="text-sm text-muted-foreground">
                Review and edit account information
              </p>
            </div>
          ),
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
                      (column) =>
                        typeof column.accessorFn !== "undefined" &&
                        column.getCanHide()
                    )
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }>
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {onRefresh ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}>
                  Refresh
                </Button>
              ) : null}
            </div>
          ),
        })}
      />
      <UserEditDrawer
        open={drawerOpen}
        onOpenChange={closeDrawer}
        user={selectedUser}
        onSubmit={onUpdate}
        availableRoles={availableRoles}
      />
    </>
  );
}
