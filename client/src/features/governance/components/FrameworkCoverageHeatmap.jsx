import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";

const COVERAGE_VARIANTS = {
  FULL: "default",
  PARTIAL: "secondary",
  COMPENSATING: "outline",
};

export function FrameworkCoverageHeatmap({ mappings = [], className }) {
  const grouped = mappings.reduce((acc, mapping) => {
    const frameworkId = mapping.framework?.id ?? mapping.frameworkId ?? "unmapped";
    if (!acc.has(frameworkId)) {
      acc.set(frameworkId, {
        id: frameworkId,
        title: mapping.framework?.title ?? frameworkId,
        rows: [],
      });
    }

    acc.get(frameworkId).rows.push(mapping);
    return acc;
  }, new Map());

  if (!grouped.size) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Framework Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No mappings have been configured.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Framework Coverage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from(grouped.values()).map((framework) => (
          <div key={framework.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{framework.title}</span>
              <Badge variant="outline">{framework.rows.length} mappings</Badge>
            </div>
            <div className="grid gap-2">
              {framework.rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex flex-col">
                    <span>{row.requirement?.code ?? row.frameworkControlId ?? "Requirement"}</span>
                    {row.requirement?.title ? (
                      <span className="text-xs text-muted-foreground">{row.requirement.title}</span>
                    ) : null}
                  </div>
                  <Badge variant={COVERAGE_VARIANTS[row.coverageLevel] ?? "outline"}>
                    {row.coverageLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
