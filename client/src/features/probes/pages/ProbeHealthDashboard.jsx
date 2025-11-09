import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { HealthStatusCard } from "@/features/probes/components/HealthStatusCard";
import { fetchProbe } from "@/features/probes/api/probesClient";
import { useProbeDeployments } from "@/features/probes/hooks/useProbeDeployments";
import { useProbeMetrics } from "@/features/probes/hooks/useProbeMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function ProbeHealthDashboard() {
  const { probeId } = useParams();
  const { metrics, isLoading } = useProbeMetrics(probeId, { refreshMs: 15000 });
  const { deployments } = useProbeDeployments(probeId, { autoRefreshMs: 60000 });
  const [probe, setProbe] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProbe() {
      if (!probeId) return;
      const record = await fetchProbe(probeId);
      if (!cancelled) {
        setProbe(record);
      }
    }
    loadProbe();
    return () => {
      cancelled = true;
    };
  }, [probeId]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <HealthStatusCard metrics={metrics} isLoading={isLoading} />
      <Card>
        <CardHeader>
          <CardTitle>Recent deployments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {deployments.length === 0 && <p className="text-sm text-muted-foreground">No deployments to display.</p>}
          {deployments.slice(0, 4).map((deployment) => (
            <div key={deployment.id} className="rounded-md border p-3">
              <p className="text-sm font-semibold">{deployment.version}</p>
              <p className="text-xs text-muted-foreground">
                {deployment.environment} • {deployment.status}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Probe summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Probe</p>
            <p className="text-lg font-semibold">{probe?.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{probe?.ownerEmail}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Frameworks</p>
            <p className="text-sm text-foreground">{probe?.frameworkBindings?.join(", ") ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last deployment</p>
            <p className="text-sm text-foreground">
              {probe?.lastDeployedAt ? new Date(probe.lastDeployedAt).toLocaleString() : "—"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
