import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

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

function UserEditDrawer({ open, onOpenChange, user, onSubmit }) {
  const [formState, setFormState] = useState({ fullName: "", status: "", tenantId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormState({
        fullName: user.fullName ?? "",
        status: user.status ?? "ACTIVE",
        tenantId: user.tenantId ?? "",
      });
      setError("");
    }
  }, [user]);

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
    [formState.fullName, formState.status, formState.tenantId, onOpenChange, onSubmit, user]
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DrawerHeader className="text-left">
            <DrawerTitle>Edit user</DrawerTitle>
            <CardDescription>{user?.email}</CardDescription>
          </DrawerHeader>
          <div className="px-4 space-y-4">
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
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DrawerFooter className="border-t bg-muted/40">
            <div className="flex w-full items-center justify-between gap-2">
              <DrawerClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DrawerClose>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export function UserTable({ users, isLoading = false, error, onRefresh, onUpdate }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [
    selectedUserId,
    users,
  ]);

  return (
    <Card className="mx-4 shadow-none lg:mx-6">
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>User management</CardTitle>
          <CardDescription>Review and edit account information</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.fullName ?? "—"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("capitalize", STATUS_BADGE_STYLES[user.status] ?? "")}
                      >
                        {STATUS_LABELS[user.status] ?? user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="truncate text-sm text-muted-foreground">
                        {(user.roles ?? []).map((role) => role.name).join(", ") || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(user.lastLoginAt)}</TableCell>
                    <TableCell>
                      {user.emailVerifiedAt ? (
                        <Badge variant="secondary">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(user.id)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <UserEditDrawer
        open={drawerOpen}
        onOpenChange={closeDrawer}
        user={selectedUser}
        onSubmit={onUpdate}
      />
    </Card>
  );
}
