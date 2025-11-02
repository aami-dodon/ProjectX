import { useMemo } from "react";
import { Cpu, HardDrive, MemoryStick, RefreshCcw } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { HealthStatusCard } from "../components/HealthStatusCard";
import { StatusBadge } from "../components/StatusBadge";
import { useClientRuntimeMetrics } from "../hooks/useClientRuntimeMetrics";
import { useHealthStatus } from "../hooks/useHealthStatus";

const clampPercentage = (value) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "--";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
};

const formatPercent = (value) => {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
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
  const { data, error, isLoading, refresh, refreshInterval } = useHealthStatus();
  const clientMetrics = useClientRuntimeMetrics({ refreshMs: refreshInterval });

  const systemStats = data?.data?.system;

  const backendMetricItems = useMemo(() => {
    const backendHost = systemStats?.metrics?.backend?.host ?? {};
    const backendProcess = systemStats?.metrics?.backend?.process ?? systemStats?.process ?? {};

    const cpu = backendHost?.cpu ?? systemStats?.cpu ?? {};
    const memory = backendHost?.memory ?? systemStats?.memory ?? {};
    const disk = backendHost?.disk ?? systemStats?.disk ?? {};
    const processCpu = backendProcess?.cpu ?? {};
    const processMemory = backendProcess?.memory ?? {};

    const cpuLoadOneMinute = cpu.loadAverages?.oneMinute;
    const hasMemoryTotals = Number.isFinite(memory.usedBytes) && Number.isFinite(memory.totalBytes);
    const hasDiskTotals = Number.isFinite(disk.usedBytes) && Number.isFinite(disk.totalBytes);

    const cpuFooterParts = [];
    if (Number.isFinite(cpuLoadOneMinute)) {
      cpuFooterParts.push(`Load (1m): ${cpuLoadOneMinute.toFixed(2)}`);
    }
    if (Number.isFinite(processCpu.averageUtilizationPercent)) {
      cpuFooterParts.push(`Node avg: ${formatPercent(processCpu.averageUtilizationPercent)}`);
    }

    const memoryFooterParts = [];
    if (Number.isFinite(memory.freeBytes)) {
      memoryFooterParts.push(`Available: ${formatBytes(memory.freeBytes)}`);
    }
    if (Number.isFinite(processMemory.heapUsedBytes) && Number.isFinite(processMemory.heapTotalBytes)) {
      memoryFooterParts.push(
        `Node heap: ${formatBytes(processMemory.heapUsedBytes)} / ${formatBytes(processMemory.heapTotalBytes)}`
      );
    } else if (Number.isFinite(processMemory.heapUsedBytes)) {
      memoryFooterParts.push(`Node heap used: ${formatBytes(processMemory.heapUsedBytes)}`);
    }

    return [
      {
        key: "backend-cpu",
        label: "CPU",
        icon: Cpu,
        primary: formatPercent(cpu.utilizationPercent),
        secondary: Number.isFinite(cpu.cores) && cpu.cores > 0 ? `${cpu.cores} cores` : null,
        footer: cpuFooterParts.length ? cpuFooterParts.join(" • ") : null,
        percent: Number.isFinite(cpu.utilizationPercent) ? clampPercentage(cpu.utilizationPercent) : null,
      },
      {
        key: "backend-memory",
        label: "Memory",
        icon: MemoryStick,
        primary: formatPercent(memory.utilizationPercent),
        secondary: hasMemoryTotals
          ? `${formatBytes(memory.usedBytes)} / ${formatBytes(memory.totalBytes)}`
          : null,
        footer: memoryFooterParts.length ? memoryFooterParts.join(" • ") : null,
        percent: Number.isFinite(memory.utilizationPercent) ? clampPercentage(memory.utilizationPercent) : null,
      },
      {
        key: "backend-disk",
        label: "Disk",
        icon: HardDrive,
        primary: formatPercent(disk.utilizationPercent),
        secondary: hasDiskTotals
          ? `${formatBytes(disk.usedBytes)} / ${formatBytes(disk.totalBytes)}`
          : null,
        footer: Number.isFinite(disk.freeBytes) ? `Free: ${formatBytes(disk.freeBytes)}` : null,
        percent: Number.isFinite(disk.utilizationPercent) ? clampPercentage(disk.utilizationPercent) : null,
      },
    ];
  }, [systemStats]);

  const frontendMetricItems = useMemo(() => {
    if (!clientMetrics) {
      return [];
    }

    const items = [];
    const cpu = clientMetrics.cpu ?? {};
    const memory = clientMetrics.memory ?? {};
    const storage = clientMetrics.storage ?? {};

    if (cpu.logicalProcessors || cpu.deviceMemoryGb) {
      items.push({
        key: "frontend-cpu",
        label: "CPU",
        icon: Cpu,
        primary: cpu.logicalProcessors ? `${cpu.logicalProcessors} cores` : "--",
        secondary: typeof cpu.deviceMemoryGb === "number" ? `${cpu.deviceMemoryGb} GB device memory` : null,
        footer: clientMetrics.timestamp
          ? `Captured at ${new Date(clientMetrics.timestamp).toLocaleTimeString()}`
          : null,
        percent: null,
      });
    }

    if (memory && (Number.isFinite(memory.usedBytes) || Number.isFinite(memory.limitBytes))) {
      const memoryPercent =
        Number.isFinite(memory.usedBytes) && Number.isFinite(memory.limitBytes)
          ? clampPercentage((memory.usedBytes / memory.limitBytes) * 100)
          : null;

      items.push({
        key: "frontend-memory",
        label: "Memory",
        icon: MemoryStick,
        primary: Number.isFinite(memory.usedBytes) ? formatBytes(memory.usedBytes) : "--",
        secondary: Number.isFinite(memory.limitBytes)
          ? `Limit: ${formatBytes(memory.limitBytes)}`
          : Number.isFinite(memory.totalBytes)
            ? `Total: ${formatBytes(memory.totalBytes)}`
            : null,
        footer: Number.isFinite(memory.totalBytes)
          ? `Total JS heap: ${formatBytes(memory.totalBytes)}`
          : null,
        percent: memoryPercent,
      });
    }

    if (storage && (Number.isFinite(storage.usageBytes) || Number.isFinite(storage.quotaBytes))) {
      const storagePercent =
        Number.isFinite(storage.utilizationPercent)
          ? clampPercentage(storage.utilizationPercent)
          : Number.isFinite(storage.usageBytes) && Number.isFinite(storage.quotaBytes)
            ? clampPercentage((storage.usageBytes / storage.quotaBytes) * 100)
            : null;

      const storageFooterParts = [];
      if (typeof storage.persisted === "boolean") {
        storageFooterParts.push(storage.persisted ? "Persisted storage" : "Non-persistent storage");
      }
      if (storage.error) {
        storageFooterParts.push(storage.error);
      }

      items.push({
        key: "frontend-storage",
        label: "Storage",
        icon: HardDrive,
        primary: Number.isFinite(storage.usageBytes) ? formatBytes(storage.usageBytes) : "--",
        secondary: Number.isFinite(storage.quotaBytes) ? `Quota: ${formatBytes(storage.quotaBytes)}` : null,
        footer: storageFooterParts.length ? storageFooterParts.join(" • ") : null,
        percent: storagePercent,
      });
    }

    return items;
  }, [clientMetrics]);

  const renderMetricCards = (items) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="border-border/60">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-md border bg-muted/60">
                    <Icon className="size-4" />
                  </span>
                  <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                </div>
                <span className="text-sm font-semibold">{item.primary}</span>
              </div>
              {Number.isFinite(item.percent) ? (
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <span
                    className="absolute inset-y-0 left-0 h-full rounded-full bg-primary"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              ) : null}
              {item.secondary ? <p className="text-xs text-muted-foreground">{item.secondary}</p> : null}
              {item.footer ? <p className="text-xs text-muted-foreground">{item.footer}</p> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : null}

        {error ? (
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
        ) : null}

        {!isLoading && !error && data?.data ? (
          <>
            {backendMetricItems.length ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold">Backend metrics</h2>
                    <p className="text-xs text-muted-foreground">Captured from the API infrastructure.</p>
                  </div>
                  {data?.timestamp ? (
                    <span className="text-xs text-muted-foreground">
                      Server sample: {new Date(data.timestamp).toLocaleTimeString()}
                    </span>
                  ) : null}
                </div>
                {renderMetricCards(backendMetricItems)}
              </div>
            ) : null}

            {frontendMetricItems.length ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold">Frontend metrics</h2>
                    <p className="text-xs text-muted-foreground">Local browser runtime indicators.</p>
                  </div>
                  {clientMetrics?.timestamp ? (
                    <span className="text-xs text-muted-foreground">
                      Browser sample: {new Date(clientMetrics.timestamp).toLocaleTimeString()}
                    </span>
                  ) : null}
                </div>
                {renderMetricCards(frontendMetricItems)}
              </div>
            ) : null}

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
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

