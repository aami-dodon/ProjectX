import { useRemediationMetrics } from "@/features/dashboards/hooks/useRemediationMetrics";
import { RemediationTrendChart } from "@/features/dashboards/components/RemediationTrendChart";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function RemediationDashboardPage() {
  const { data, isLoading, error, refresh } = useRemediationMetrics({});
  const summary = data?.summary ?? null;
  const meanTimeToClose =
    typeof summary?.meanTimeToCloseHours === "number" ? `${summary.meanTimeToCloseHours}h` : "--";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Remediation metrics</h1>
            <p className="text-sm text-muted-foreground">SLA adherence and backlog trends.</p>
          </div>
          <Button variant="outline" onClick={() => refresh().catch(() => null)}>
            Refresh
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">Unable to load remediation data.</p>
            <p className="text-sm text-muted-foreground">{error.message ?? "Unknown error"}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard label="Open tasks" value={summary?.openTasks} />
            <SummaryCard label="Overdue" value={summary?.overdueTasks} variant="destructive" />
            <SummaryCard label="Escalated" value={summary?.escalatedTasks} />
            <SummaryCard label="Mean time to close" value={meanTimeToClose} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <RemediationTrendChart data={data?.throughput ?? []} />
            <Card>
              <CardHeader>
                <CardTitle>Backlog by owner</CardTitle>
                <CardDescription>Teams with the largest backlog.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.backlogByOwner ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No backlog data found.</p>
                ) : (
                  data.backlogByOwner.map((owner) => (
                    <div key={owner.owner} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{owner.owner}</p>
                        <p className="text-xs text-muted-foreground">{owner.overdue} overdue</p>
                      </div>
                      <Badge variant="secondary">{owner.total}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, variant }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value ?? "--"}</CardTitle>
      </CardHeader>
      {variant === "destructive" && (
        <CardContent>
          <p className="text-xs text-muted-foreground">Prioritize these items to restore SLAs.</p>
        </CardContent>
      )}
    </Card>
  );
}
