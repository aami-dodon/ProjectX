import { Link } from "react-router-dom";
import { IconArrowUpRight } from "@tabler/icons-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

const STATE_LABELS = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  ESCALATED: "Escalated",
  COMPLETED: "Completed",
};

const STATE_ORDER = ["OPEN", "IN_PROGRESS", "ESCALATED", "COMPLETED"];

export function ReviewQueueCard({ reviewQueue = {} }) {
  const states = reviewQueue.byState ?? {};
  const urgent = Array.isArray(reviewQueue.urgent) ? reviewQueue.urgent.slice(0, 3) : [];
  const orderedStates = buildStateList(states);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Review queue</CardTitle>
          <CardDescription>Manual approvals that block final attestation.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/governance/review-queue" className="inline-flex items-center gap-1">
            View
            <IconArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {orderedStates.length ? (
            orderedStates.map(({ key, label, value }) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground sm:col-span-2">
              No review workload yet.
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Urgent reviews</span>
            {typeof reviewQueue.overdue === "number" && reviewQueue.overdue > 0 ? (
              <Badge variant="destructive">{reviewQueue.overdue} overdue</Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">Top items ordered by due date.</p>
          <div className="mt-3 space-y-3">
            {urgent.length ? (
              urgent.map((item) => (
                <div key={item.id ?? item.check?.id ?? item.dueAt} className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.check?.name ?? "Review task"}</p>
                    {item.priority ? <Badge variant="outline">{item.priority}</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDueDate(item.dueAt)}
                    {item.result?.severity ? ` · Severity ${item.result.severity}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Result status: {item.result?.status ?? "PENDING"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No urgent items detected.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildStateList(states) {
  const keys = new Set([...STATE_ORDER, ...Object.keys(states ?? {})]);
  return Array.from(keys)
    .map((key) => ({
      key,
      label: STATE_LABELS[key] ?? key,
      value: states[key] ?? 0,
    }))
    .filter((entry) => entry.value > 0)
    .slice(0, 4);
}

function formatDueDate(value) {
  if (!value) {
    return "No due date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown due date";
  }

  const now = Date.now();
  const isOverdue = date.getTime() < now;
  const formatted = date.toLocaleString();
  return isOverdue ? `${formatted} · overdue` : formatted;
}
