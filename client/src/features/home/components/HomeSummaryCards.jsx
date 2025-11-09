import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { formatPercent, formatPercentDelta } from "@/shared/lib/score-format";

const CLASS_LABEL = {
  PASSING: "Healthy posture",
  NEEDS_ATTENTION: "Needs attention",
  FAILING: "At risk",
};

const CLASS_COLORS = {
  PASSING: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
  NEEDS_ATTENTION: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
  FAILING: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200",
};

export function HomeSummaryCards({ summary = {}, frameworks = {}, reviewQueue = {} }) {
  const posturePercent = formatPercent(summary.postureScore);
  const postureDelta = formatPercentDelta(summary.postureChange);
  const classification = summary.postureClassification;

  const metrics = [
    {
      id: "posture",
      label: "Posture score",
      value: posturePercent ?? "—",
      description: "Weighted control score across the estate.",
      badge: classification ? (
        <Badge
          variant="outline"
          className={cn(
            "mt-2 w-fit text-xs font-medium",
            CLASS_COLORS[classification] ?? "text-foreground"
          )}
        >
          {CLASS_LABEL[classification] ?? classification}
        </Badge>
      ) : null,
      footnote: postureDelta ? `${postureDelta} vs last window` : "No prior run captured yet.",
    },
    {
      id: "controls",
      label: "Catalogued controls",
      value: formatNumber(summary.totalControls),
      description: `${formatNumber(summary.activeControls)} active in lifecycle.`,
      footnote:
        typeof summary.failingControls === "number"
          ? `${summary.failingControls} marked for remediation`
          : null,
    },
    {
      id: "reviews",
      label: "Open review tasks",
      value: formatNumber(summary.openReviewTasks),
      description: "Manual and hybrid checks awaiting sign-off.",
      footnote:
        typeof reviewQueue.overdue === "number" && reviewQueue.overdue > 0
          ? `${reviewQueue.overdue} overdue right now`
          : "All tasks within SLA.",
    },
    {
      id: "frameworks",
      label: "Framework coverage",
      value:
        typeof frameworks.coveragePercent === "number"
          ? `${frameworks.coveragePercent}%`
          : "—",
      description: `${formatNumber(frameworks.withCoverage)} of ${formatNumber(
        frameworks.total
      )} frameworks mapped to controls.`,
      footnote: frameworks.items?.[0]?.title
        ? `Top coverage: ${frameworks.items[0].title}`
        : null,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.id}>
          <CardHeader className="pb-2">
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="text-3xl font-semibold">{metric.value}</CardTitle>
            {metric.badge}
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            <p>{metric.description}</p>
            {metric.footnote ? <p className="mt-1 text-xs">{metric.footnote}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }
  return value.toLocaleString();
}
