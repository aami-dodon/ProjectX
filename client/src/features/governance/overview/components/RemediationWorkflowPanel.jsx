import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

export function RemediationWorkflowPanel({ reviewQueue, runs }) {
  const urgent = reviewQueue?.urgent ?? [];
  const reviewStates = reviewQueue?.byState ?? {};
  const recentRuns = runs ?? [];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Remediation workflow</CardTitle>
        <CardDescription>Queue health and most recent check executions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StateMetric label="Open" value={reviewStates.OPEN} />
          <StateMetric label="In progress" value={reviewStates.IN_PROGRESS} />
          <StateMetric label="Escalated" value={reviewStates.ESCALATED} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">Urgent queue</p>
            <p className="text-xs text-muted-foreground">Top-priority reviews sorted by due date.</p>
            <div className="mt-3 space-y-3">
              {urgent.length ? (
                urgent.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.check?.name ?? "Review task"}</p>
                      <Badge>{item.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due {item.dueAt ? new Date(item.dueAt).toLocaleString() : "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Result {item.result?.status ?? "UNKNOWN"} — Severity {item.result?.severity ?? "N/A"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No urgent reviews in the queue.
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Recent runs</p>
            <p className="text-xs text-muted-foreground">Latest executions feeding the dashboard.</p>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Executed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRuns.length ? (
                    recentRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          <div className="text-sm font-medium">{run.check?.name ?? "Unnamed check"}</div>
                          {run.control ? (
                            <div className="text-xs text-muted-foreground">{run.control.title}</div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={run.status === "PASS" ? "outline" : "destructive"}>{run.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {run.executedAt ? new Date(run.executedAt).toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        No recent executions yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StateMetric({ label, value }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value ?? 0}</p>
    </div>
  );
}
