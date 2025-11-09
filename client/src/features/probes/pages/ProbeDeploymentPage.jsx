import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { DeploymentTimeline } from "@/features/probes/components/DeploymentTimeline";
import { fetchProbe } from "@/features/probes/api/probesClient";
import { useProbeDeployments } from "@/features/probes/hooks/useProbeDeployments";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export function ProbeDeploymentPage() {
  const { probeId } = useParams();
  const { deployments, launchDeployment, isLoading, refresh } = useProbeDeployments(probeId);
  const [probe, setProbe] = useState(null);
  const [formState, setFormState] = useState({
    version: "",
    environment: "prod",
    canaryPercent: 10,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await launchDeployment({
        version: formState.version,
        environment: formState.environment,
        canaryPercent: Number(formState.canaryPercent) || 0,
      });
      toast.success("Deployment launched");
      setFormState((prev) => ({ ...prev, version: "" }));
      refresh();
    } catch (error) {
      toast.error(error?.message ?? "Failed to launch deployment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DeploymentTimeline deployments={deployments} isLoading={isLoading} />
      <Card>
        <CardHeader>
          <CardTitle>Launch deployment</CardTitle>
        </CardHeader>
        <CardContent>
          {probe && (
            <p className="mb-4 text-sm text-muted-foreground">
              Target probe <span className="font-medium text-foreground">{probe.name}</span>
            </p>
          )}
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="deployment-version">Version</Label>
              <Input id="deployment-version" name="version" value={formState.version} onChange={handleChange} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="deployment-environment">Environment</Label>
              <Input id="deployment-environment" name="environment" value={formState.environment} onChange={handleChange} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="deployment-canary">Canary %</Label>
              <Input
                id="deployment-canary"
                name="canaryPercent"
                type="number"
                min="0"
                max="100"
                value={formState.canaryPercent}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={isSubmitting || !formState.version} className="w-full">
              Launch
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
