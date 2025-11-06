import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";

function groupPoliciesBySubject(policies = []) {
  return policies.reduce((acc, policy) => {
    if (!policy || policy.deletedAt) {
      return acc;
    }

    const subject = (policy.subject || "(anonymous)").toLowerCase();
    if (!acc[subject]) {
      acc[subject] = [];
    }

    acc[subject].push(policy);
    return acc;
  }, {});
}

export function PermissionMatrix({ policies = [], isLoading }) {
  const grouped = useMemo(() => groupPoliciesBySubject(policies), [policies]);
  const subjects = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
        <CardDescription>Effective policy mappings grouped by Casbin subject.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground py-6 text-sm">Evaluating policies…</div>
        ) : subjects.length === 0 ? (
          <div className="text-muted-foreground py-6 text-sm">No policies found for the selected scope.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Effect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) =>
                grouped[subject].map((policy) => (
                  <TableRow key={`${subject}-${policy.id}`}>
                    <TableCell className="capitalize">{subject}</TableCell>
                    <TableCell>{policy.object || "*"}</TableCell>
                    <TableCell>{policy.action || "*"}</TableCell>
                    <TableCell>{policy.domain || "global"}</TableCell>
                    <TableCell>
                      <Badge variant={policy.effect === "deny" ? "destructive" : "outline"}>
                        {policy.effect || "allow"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
