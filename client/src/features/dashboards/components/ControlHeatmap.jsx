import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function ControlHeatmap({ matrix = [] }) {
  const sorted = matrix.slice().sort((a, b) => b.failing - a.failing);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Control health matrix</CardTitle>
        <CardDescription>Domain, owner, and risk tier projections with failing counts.</CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No control health data available.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((entry) => (
              <div key={`${entry.domain}-${entry.riskTier}-${entry.ownerTeam}`} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{entry.domain}</p>
                    <p className="text-xs text-muted-foreground">{entry.ownerTeam}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{entry.riskTier}</span>
                </div>
                <div className="mt-3 flex items-end gap-4">
                  <div>
                    <p className="text-3xl font-semibold">{entry.failing}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Failing</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold">{entry.avgScore !== null ? `${Math.round(entry.avgScore * 100)}%` : "--"}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Score</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {entry.controls} controls • {entry.overdueTasks} overdue tasks
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
