import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function ControlCoverageChart({ coverage }) {
  const totals = coverage?.totals ?? { controls: 0, mandatory: 0, recommended: 0, optional: 0 };
  const distribution = (coverage?.distribution ?? []).slice(0, 8);

  const totalLinks = distribution.reduce((sum, entry) => sum + entry.links, 0);
  const toPercent = (value) => {
    if (!totalLinks) return 0;
    return Math.round((value / totalLinks) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Control Coverage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Total Controls" value={totals.controls ?? 0} />
          <Metric label="Mandatory" value={totals.mandatory ?? 0} />
          <Metric label="Recommended" value={totals.recommended ?? 0} />
        </div>
        <div className="space-y-3">
          {distribution.length ? (
            distribution.map((entry) => (
              <div key={entry.controlId}>
                <div className="flex items-center justify-between text-sm">
                  <span>{entry.controlId}</span>
                  <span className="text-muted-foreground">{entry.links} links</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${toPercent(entry.links)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No control mappings configured.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
