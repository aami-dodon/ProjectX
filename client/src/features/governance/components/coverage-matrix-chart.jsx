import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function CoverageMatrixChart({ matrix = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coverage matrix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {matrix.length ? (
          matrix.map((entry) => (
            <div key={entry.targetFrameworkId} className="rounded-lg border p-3 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{entry.targetFrameworkTitle}</p>
                  <p className="text-xs text-muted-foreground">{entry.total} mapped controls</p>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {entry.coveragePercent}% coverage
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-3 text-sm">
                <StrengthPill label="Exact" value={entry.exact} />
                <StrengthPill label="Partial" value={entry.partial} />
                <StrengthPill label="Informative" value={entry.informative} />
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${entry.coveragePercent ?? 0}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Mapping matrix will populate after controls are aligned.</p>
        )}
      </CardContent>
    </Card>
  );
}

function StrengthPill({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
      <span>{label}</span>
      <span className="font-semibold">{value ?? 0}</span>
    </div>
  );
}
