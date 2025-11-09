import { IconArrowUpRight, IconRefresh } from "@tabler/icons-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

const CLASS_LABEL = {
  PASSING: "Healthy posture",
  NEEDS_ATTENTION: "Needs attention",
  FAILING: "At risk",
};

const CLASS_COLORS = {
  PASSING: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  NEEDS_ATTENTION: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  FAILING: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

export function GovernanceScorecard({ summary, checks, onRefresh, isRefreshing }) {
  const posturePercent =
    typeof summary?.postureScore === "number" ? Math.round(summary.postureScore * 1000) / 10 : null;
  const deltaPercent =
    typeof summary?.postureChange === "number" ? Math.round(summary.postureChange * 1000) / 10 : null;
  const classification = summary?.postureClassification ?? null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Governance Overview</CardTitle>
          <CardDescription>Real-time posture, open risks, and scoring coverage.</CardDescription>
        </div>
        {onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <IconRefresh className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric
            label="Posture Score"
            value={posturePercent !== null ? `${posturePercent}%` : "—"}
            description="Weighted control score across the estate."
            badge={
              classification ? (
                <Badge variant="outline" className={cn("text-xs font-medium", CLASS_COLORS[classification])}>
                  {CLASS_LABEL[classification] ?? classification}
                </Badge>
              ) : null
            }
          />
          <Metric
            label="Change vs. last run"
            value={deltaPercent !== null ? `${deltaPercent > 0 ? "+" : ""}${deltaPercent}%` : "—"}
            description="Signals improvement or regression from the prior run."
            icon={<IconArrowUpRight className={cn("h-4 w-4", deltaPercent < 0 && "rotate-90")} />}
          />
          <Metric
            label="Failing controls"
            value={summary?.failingControls ?? 0}
            description="Controls classified as failing or needing attention."
          />
          <Metric
            label="Open review tasks"
            value={summary?.openReviewTasks ?? 0}
            description="Manual/hybrid checks awaiting reviewer action."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Metric
            label="Total controls"
            value={summary?.totalControls ?? 0}
            description="Catalog entries under active governance."
          />
          <Metric
            label="Active controls"
            value={summary?.activeControls ?? 0}
            description="Controls in an ACTIVE lifecycle state."
          />
          <Metric
            label="Frameworks with coverage"
            value={summary?.frameworksWithCoverage ?? 0}
            description="Frameworks backed by at least one mapped control."
          />
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Check distribution</p>
          <p className="text-xs text-muted-foreground">
            Status, type, and severity breakdown for the execution catalogue.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <DistributionList label="Status" data={checks?.byStatus} />
            <DistributionList label="Type" data={checks?.byType} />
            <DistributionList label="Severity" data={checks?.bySeverity} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, description, badge, icon }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between text-xs font-medium uppercase text-muted-foreground">
        <span>{label}</span>
        {icon ?? null}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-3xl font-semibold">{value}</p>
        {badge}
      </div>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

function DistributionList({ label, data = {} }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 4);

  if (!entries.length) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        No {label.toLowerCase()} data.
      </div>
    );
  }

  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-2 space-y-2">
        {entries.map(([key, value]) => (
          <div key={key}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{key}</span>
              <span className="text-muted-foreground">{value}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${total ? Math.min(100, Math.round((value / total) * 100)) : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
