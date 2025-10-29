import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import { IconSearch } from "@tabler/icons-react";

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

function DetailRow({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm leading-tight text-foreground">{children}</div>
    </div>
  );
}

function UserEditDrawer({ open, onOpenChange, user, onSubmit, availableRoles = [] }) {
  const [formState, setFormState] = useState({
    fullName: "",
    status: "",
    roleIds: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("edit");

  const formId = useMemo(
    () => (user?.id ? `user-${user.id}-edit` : "user-edit"),
    [user?.id]
  );

  useEffect(() => {
    if (user) {
      setFormState({
        fullName: user.fullName ?? "",
        status: user.status ?? "ACTIVE",
        roleIds: (user.roles ?? []).map((role) => `${role.id}`),
      });
      setError("");
    }
  }, [user]);

  useEffect(() => {
    if (!open) {
      setActiveTab("edit");
    }
  }, [open]);

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
      formState.roleIds,
      onOpenChange,
      onSubmit,
      user,
    ]
  );

  const handleCancel = useCallback(() => {
    setError("");
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full max-h-[85vh] w-full flex-col overflow-hidden border-l bg-background shadow-xl sm:max-w-xl">
        <DrawerHeader className="border-b px-6 py-6 text-left">
          <DrawerTitle>Edit user</DrawerTitle>
          {user?.email ? <DrawerDescription>{user.email}</DrawerDescription> : null}
        </DrawerHeader>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full flex-1 flex-col"
        >
          <div className="border-b px-6 py-3">
            <TabsList className="bg-muted/60 text-muted-foreground h-9 gap-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="edit" className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={formState.fullName}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formState.status}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, status: value }))
                    }
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
                        const roleId = `${role.id}`;
                        const checked = formState.roleIds.includes(roleId);
                        return (
                          <label
                            key={roleId}
                            htmlFor={`role-${roleId}`}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Checkbox
                              id={`role-${roleId}`}
                              checked={checked}
                              onCheckedChange={(value) =>
                                handleRoleToggle(roleId, value === true)
                              }
                            />
                            <span className="flex flex-1 flex-col">
                              <span className="font-medium leading-none">{role.name}</span>
                              {role.description ? (
                                <span className="text-xs text-muted-foreground">
                                  {role.description}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No roles available for assignment.
                      </p>
                    )}
                  </div>
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </form>
            </div>
            <DrawerFooter className="border-t px-6 py-4">
              <div className="flex w-full items-center justify-between gap-2">
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" form={formId} disabled={submitting}>
                  {submitting ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </DrawerFooter>
          </TabsContent>
          <TabsContent value="overview" className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-4 text-sm">
                <DetailRow label="Full name">{user?.fullName ?? "—"}</DetailRow>
                <DetailRow label="Email">
                  <span className="font-mono text-sm">{user?.email ?? "—"}</span>
                </DetailRow>
                <DetailRow label="Status">
                  <Badge
                    variant="outline"
                    className={cn("capitalize", STATUS_BADGE_STYLES[user?.status] ?? "")}
                  >
                    {STATUS_LABELS[user?.status] ?? user?.status ?? "—"}
                  </Badge>
                </DetailRow>
                <DetailRow label="Roles">
                  {(user?.roles ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <Badge key={role.id} variant="outline" className="px-2 py-1 text-xs">
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </DetailRow>
                <DetailRow label="Last login">{formatDate(user?.lastLoginAt)}</DetailRow>
                <DetailRow label="Verified">{user?.emailVerifiedAt ? "Yes" : "No"}</DetailRow>
              </div>
            </div>
            <DrawerFooter className="border-t px-6 py-4">
              <div className="flex w-full items-center justify-between gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Close
                </Button>
                <Button type="button" onClick={() => setActiveTab("edit")}>Edit user</Button>
              </div>
            </DrawerFooter>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const handleEdit = useCallback((userId) => {
    setSelectedUserId(userId);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(
    (open) => {
      setDrawerOpen(open);
      if (!open) {
        setSelectedUserId(null);
      }
    },
    []
  );

  const normalizedRoles = useMemo(
    () => availableRoles.map((role) => ({ ...role, id: `${role.id}` })),
    [availableRoles]
  );

  const filtersApplied = useMemo(() => {
    return (
      searchTerm.trim() !== "" || statusFilter !== "all" || roleFilter !== "all"
    );
  }, [searchTerm, statusFilter, roleFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = searchTerm.trim()
        ? [user.fullName, user.email]
            .filter(Boolean)
            .some((value) =>
              value.toLowerCase().includes(searchTerm.trim().toLowerCase())
            )
        : true;

      const matchesStatus =
        statusFilter === "all" ? true : user.status === statusFilter;

      const matchesRole =
        roleFilter === "all"
          ? true
          : (user.roles ?? []).some((role) => `${role.id}` === roleFilter);

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  const errorMessage = typeof error === "string" ? error : error?.message;

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  return (
    <>
      <Card className="overflow-hidden border">
        <CardHeader className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold leading-tight">
              User management
            </CardTitle>
            <CardDescription>Review and edit account information</CardDescription>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <Badge variant="outline" className="bg-muted/60 text-xs font-medium">
              {filteredUsers.length} of {users.length} users
            </Badge>
            {onRefresh ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:max-w-xs">
                <Label htmlFor="user-search" className="sr-only">
                  Search users
                </Label>
                <div className="relative">
                  <IconSearch className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="user-search"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="sm:w-48">
                  <Label htmlFor="status-filter" className="sr-only">
                    Filter by status
                  </Label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="role-filter" className="sr-only">
                    Filter by role
                  </Label>
                  <Select
                    value={roleFilter}
                    onValueChange={setRoleFilter}
                  >
                    <SelectTrigger id="role-filter" className="w-full">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      {normalizedRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setRoleFilter("all");
                }}
                disabled={!filtersApplied}
              >
                Clear filters
              </Button>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-8 w-16" />
                        </TableCell>
                      </TableRow>
                    ))
                  : null}

                {!isLoading && filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      {filtersApplied
                        ? "No users match your filters."
                        : "No users found."}
                    </TableCell>
                  </TableRow>
                ) : null}

                {!isLoading
                  ? filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {user.fullName ?? "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{user.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              STATUS_BADGE_STYLES[user.status] ?? ""
                            )}
                          >
                            {STATUS_LABELS[user.status] ?? user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(user.roles ?? []).length > 0 ? (
                            <div className="flex max-w-[260px] flex-wrap gap-2">
                              {user.roles.map((role) => (
                                <Badge
                                  key={role.id}
                                  variant="outline"
                                  className="rounded-full px-2 py-1 text-xs"
                                >
                                  {role.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(user.lastLoginAt)}</span>
                        </TableCell>
                        <TableCell>
                          {user.emailVerifiedAt ? (
                            <Badge variant="secondary">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(user.id)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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
