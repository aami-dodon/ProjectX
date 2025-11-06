import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AccessReviewSummary } from "@/features/admin/rbac/components/AccessReviewSummary";
import { PermissionMatrix } from "@/features/admin/rbac/components/PermissionMatrix";
import { RoleInheritanceGraph } from "@/features/admin/rbac/components/RoleInheritanceGraph";
import { useRoleAssignments } from "@/features/admin/rbac/hooks/useRoleAssignments";
import { useRoles } from "@/features/admin/rbac/hooks/useRoles";
import { usePolicies } from "@/features/admin/rbac/hooks/usePolicies";
import { triggerAccessReview } from "@/features/admin/rbac/api/rbac-client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

const DEFAULT_DOMAIN = "global";

export function RoleListPage() {
  const navigate = useNavigate();
  const [domain] = useState(DEFAULT_DOMAIN);
  const { roles, summary, isLoading: rolesLoading, error: rolesError } = useRoles({ domain });
  const { policies, isLoading: policiesLoading } = usePolicies({ domain });
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const {
    role: selectedRole,
    isLoading: roleDetailLoading,
  } = useRoleAssignments(selectedRoleId);

  const handleLaunchReview = (payload) => triggerAccessReview({ ...payload, reason: "manual" });

  const activeRoles = useMemo(() => roles.filter((role) => !role.archivedAt), [roles]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-6 px-4 py-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                Manage Casbin role templates and review their tenant domains.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rolesError ? (
                <p className="text-sm text-destructive">{rolesError.message ?? "Unable to load roles."}</p>
              ) : null}
              <Table className="text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Assignments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolesLoading && roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        Loading roles…
                      </TableCell>
                    </TableRow>
                  ) : activeRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No active roles found for this domain.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeRoles.map((role) => (
                      <TableRow
                        key={role.id}
                        data-state={role.id === selectedRoleId ? "selected" : undefined}
                        className={cn("cursor-pointer", role.id === selectedRoleId ? "bg-muted" : undefined)}
                        onClick={() => setSelectedRoleId(role.id)}
                      >
                        <TableCell className="font-medium capitalize">{role.name}</TableCell>
                        <TableCell className="text-muted-foreground">{role.description ?? "—"}</TableCell>
                        <TableCell>{role.domain ?? "global"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{role.assignmentCount ?? 0}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Total: {summary.total}</span>
                <span>Active: {summary.active}</span>
                <span>Archived: {summary.archived}</span>
              </div>
            </CardContent>
          </Card>
          <AccessReviewSummary domain={domain} onLaunch={handleLaunchReview} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <RoleInheritanceGraph role={selectedRole} isLoading={roleDetailLoading} />
          <PermissionMatrix policies={policies} isLoading={policiesLoading} />
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Policy Overview</CardTitle>
              <CardDescription>
                Policies underpinning the selected domain. Use the policy editor for full CRUD workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {policies.length === 0 ? (
                <span>No policies configured for {domain}.</span>
              ) : (
                policies.slice(0, 12).map((policy) => (
                  <Badge key={policy.id} variant="secondary" className="capitalize">
                    {policy.subject} · {policy.object || "*"} · {policy.action || "*"}
                  </Badge>
                ))
              )}
              {policies.length > 12 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate("/admin/access-control/policies")}
                >
                  View all in policy editor
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
