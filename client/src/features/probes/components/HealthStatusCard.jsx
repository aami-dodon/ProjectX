import { Activity, AlertTriangle, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

const STATUS_COLORS = {
  operational: "text-emerald-600",
  degraded: "text-amber-500",
  outage: "text-destructive",
  unknown: "text-muted-foreground",
};

export function HealthStatusCard({ metrics, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Probe health</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Probe health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No heartbeat data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className={`h-4 w-4 ${STATUS_COLORS[metrics.status] ?? STATUS_COLORS.unknown}`} />
          Probe health
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p className={`text-lg font-semibold capitalize ${STATUS_COLORS[metrics.status] ?? STATUS_COLORS.unknown}`}>
            {metrics.status}
          </p>
          <p className="text-xs text-muted-foreground">
            Last heartbeat: {metrics.lastHeartbeatAt ? new Date(metrics.lastHeartbeatAt).toLocaleString() : "Never"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />Failures (24h)
          </p>
          <p className="text-lg font-semibold">{metrics.failureCount24h ?? 0}</p>
          <p className="text-xs text-muted-foreground">Last error: {metrics.lastErrorCode || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />Latency (p95 / p99)
          </p>
          <p className="text-lg font-semibold">
            {metrics.latencyP95Ms ?? "—"} ms / {metrics.latencyP99Ms ?? "—"} ms
          </p>
          <p className="text-xs text-muted-foreground">Heartbeat interval ~ {metrics.heartbeatIntervalSeconds || 0}s</p>
        </div>
      </CardContent>
    </Card>
  );
}
