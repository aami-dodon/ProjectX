import { useParams } from "react-router-dom";

import { PermissionMatrix } from "@/features/admin/rbac/components/PermissionMatrix";
import { RoleInheritanceGraph } from "@/features/admin/rbac/components/RoleInheritanceGraph";
import { useRoleAssignments } from "@/features/admin/rbac/hooks/useRoleAssignments";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

export function RoleDetailPage() {
  const { roleId } = useParams();
  const { role, assignments, policies, isLoading, error } = useRoleAssignments(roleId);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>{role?.name ?? "Role"}</CardTitle>
            <CardDescription>
              {role?.description ?? "Review role metadata, direct assignments, and policy coverage."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-destructive">{error.message ?? "Failed to load role details."}</p>
            ) : null}
            <div className="grid gap-6 lg:grid-cols-2">
              <RoleInheritanceGraph role={role} isLoading={isLoading} />
              <div>
                <p className="text-xs uppercase text-muted-foreground">Domain</p>
                <p className="font-medium text-sm">{role?.domain ?? "global"}</p>
                <p className="text-xs uppercase text-muted-foreground mt-4">Review cadence</p>
                <p className="text-sm text-muted-foreground">
                  {role?.reviewCadenceDays ? `${role.reviewCadenceDays} days` : "Not scheduled"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>Current members with the role.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead>Expires At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No active assignments.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.user?.fullName ?? assignment.user?.email ?? assignment.userId}</TableCell>
                      <TableCell>{assignment.user?.email ?? "—"}</TableCell>
                      <TableCell>{assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : "—"}</TableCell>
                      <TableCell>{assignment.expiresAt ? new Date(assignment.expiresAt).toLocaleString() : "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <PermissionMatrix policies={policies} isLoading={isLoading} />
      </div>
    </div>
  );
}
