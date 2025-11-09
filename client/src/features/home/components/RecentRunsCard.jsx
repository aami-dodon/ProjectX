import { Link } from "react-router-dom";
import { IconArrowUpRight } from "@tabler/icons-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

const STATUS_VARIANT = {
  PASS: "outline",
  SUCCESS: "outline",
  FAIL: "destructive",
  ERROR: "destructive",
  WARN: "secondary",
};

export function RecentRunsCard({ runs = [] }) {
  const items = Array.isArray(runs) ? runs.slice(0, 6) : [];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Recent runs</CardTitle>
          <CardDescription>Latest control executions feeding posture.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/governance/results" className="inline-flex items-center gap-1">
            Explore
            <IconArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Executed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{run.check?.name ?? "Unnamed check"}</div>
                      {run.control ? (
                        <p className="text-xs text-muted-foreground">{run.control.title}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[run.status] ?? "secondary"}>{run.status ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{run.severity ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(run.executedAt)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No executions yet. Trigger runs from the governance module to populate this list.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimestamp(value) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}
