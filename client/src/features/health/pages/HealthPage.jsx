import { useMemo } from "react";
import { IconDatabase, IconRefresh, IconShieldLock, IconTopologyStarRing3 } from "@tabler/icons-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { HealthStatusCard } from "../components/HealthStatusCard";
import { StatusBadge } from "../components/StatusBadge";
import { useHealthStatus } from "../hooks/useHealthStatus";

const STATUS_ICON_MAP = {
  system: IconTopologyStarRing3,
  api: IconDatabase,
  cors: IconShieldLock,
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return "Unknown";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length || remainingSeconds) parts.push(`${remainingSeconds}s`);
  return parts.join(" ");
};

export function HealthPage() {
  const { data, error, isLoading, refresh, summary, refreshInterval } = useHealthStatus();

  const overviewItems = useMemo(() => {
    return [
      {
        key: "system",
        title: "System",
        description: "Runtime diagnostics for the API server process.",
        status: summary.statuses.system,
        icon: STATUS_ICON_MAP.system,
      },
      {
        key: "api",
        title: "API",
        description: "Database connectivity and service orchestration.",
        status: summary.statuses.api,
        icon: STATUS_ICON_MAP.api,
      },
      {
        key: "cors",
        title: "CORS",
        description: "Allowed origins and credential policies.",
        status: summary.statuses.cors,
        icon: STATUS_ICON_MAP.cors,
      },
    ];
  }, [summary.statuses.api, summary.statuses.cors, summary.statuses.system]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">System Health</h1>
            <p className="text-sm text-muted-foreground">
              Real-time diagnostics for the API, database connectivity, and CORS policy alignment.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={summary.status} />
            <Button onClick={refresh} size="sm" variant="outline" className="flex items-center gap-2">
              <IconRefresh className="size-4" />
              Refresh
            </Button>
          </div>
        </div>
        {data?.timestamp ? (
          <p className="text-xs text-muted-foreground">
            Last checked at {new Date(data.timestamp).toLocaleString()}
            {refreshInterval
              ? ` (auto-refreshing every ${Math.round(refreshInterval / 1000)} seconds)`
              : ''}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/60 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Unable to load health status</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={refresh} variant="destructive">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {overviewItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key} className="border-border/80">
                <CardHeader className="gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-10 items-center justify-center rounded-full border bg-muted/40">
                        <Icon className="size-5" />
                      </span>
                      <div className="flex flex-col">
                        <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && !error && data?.data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <HealthStatusCard
            title="System Diagnostics"
            status={data.data.system?.status}
            description="Server uptime and runtime environment checks."
            items={[
              {
                label: "Process Uptime",
                value: formatDuration(data.data.system?.uptimeSeconds ?? 0),
                helpText: "Time since the Node.js process was started.",
              },
              {
                label: "Started At",
                value: data.data.system?.startedAt
                  ? new Date(data.data.system.startedAt).toLocaleString()
                  : "Unknown",
                helpText: "Timestamp for the last server restart.",
              },
              {
                label: "Node.js Version",
                value: data.data.system?.nodeVersion ?? "Unknown",
              },
            ]}
            footer={
              data.data.system?.environment
                ? `Environment: ${data.data.system.environment}`
                : null
            }
          />
          <HealthStatusCard
            title="API Connectivity"
            status={data.data.api?.status}
            description="Database round trip and service availability checks."
            items={[
              {
                label: "Database Status",
                value: <StatusBadge status={data.data.api?.database?.status} />,
                helpText: `Latency: ${data.data.api?.database?.latencyMs ?? "--"} ms`,
              },
              {
                label: "Last Checked",
                value: data.data.api?.checkedAt
                  ? new Date(data.data.api.checkedAt).toLocaleString()
                  : "Unknown",
              },
              {
                label: "Error Details",
                value: data.data.api?.database?.error
                  ? data.data.api.database.error
                  : "None",
              },
            ]}
            footer={`Database Provider: ${data.data.api?.database?.provider ?? "PostgreSQL"}`}
          />
          <HealthStatusCard
            title="CORS Configuration"
            status={data.data.cors?.status}
            description="Evaluates whether required origins and credential settings are active."
            items={[
              {
                label: "Allowed Origins",
                value: (
                  <div className="flex flex-col gap-1">
                    {(data.data.cors?.allowedOrigins ?? []).map((origin) => (
                      <code
                        key={origin}
                        className="rounded-md bg-muted px-2 py-1 text-xs"
                      >
                        {origin}
                      </code>
                    ))}
                    {data.data.cors?.allowedOrigins?.length === 0 ? (
                      <span className="text-muted-foreground">No origins configured.</span>
                    ) : null}
                  </div>
                ),
              },
              {
                label: "Allows Credentials",
                value: data.data.cors?.allowsCredentials ? "Yes" : "No",
              },
              {
                label: "Required Headers",
                value: (
                  <div className="flex flex-wrap gap-1">
                    {(data.data.cors?.allowedHeaders ?? []).map((header) => (
                      <code key={header} className="rounded-md bg-muted px-2 py-1 text-xs">
                        {header}
                      </code>
                    ))}
                  </div>
                ),
              },
            ]}
            footer={
              data.data.cors?.issues?.length
                ? data.data.cors.issues.join(" • ")
                : "CORS configuration matches the required policy."
            }
          />
        </div>
      ) : null}
    </div>
  );
}
