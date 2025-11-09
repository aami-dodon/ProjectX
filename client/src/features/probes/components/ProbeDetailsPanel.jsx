import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";

const statusText = {
  draft: "Draft",
  active: "Active",
  deprecated: "Deprecated",
  unknown: "Unknown",
};

const initialFormState = {
  name: "",
  ownerEmail: "",
  frameworks: "",
  tags: "",
  heartbeatIntervalSeconds: 300,
  environmentOverlays: "",
};

export function ProbeDetailsPanel({ probe, onRegister, isRegistering }) {
  const [formState, setFormState] = useState(initialFormState);
  const [formError, setFormError] = useState(null);

  const environmentOverlays = useMemo(() => {
    if (!probe?.environmentOverlays) return [];
    return Object.keys(probe.environmentOverlays);
  }, [probe]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!formState.name || !formState.ownerEmail || !formState.frameworks) {
      setFormError("Name, owner email, and frameworks are required.");
      return;
    }

    let overlays = undefined;
    if (formState.environmentOverlays.trim()) {
      try {
        overlays = JSON.parse(formState.environmentOverlays);
      } catch (error) {
        setFormError("Environment overlays must be valid JSON");
        return;
      }
    }

    await onRegister?.({
      name: formState.name.trim(),
      ownerEmail: formState.ownerEmail.trim(),
      frameworkBindings: formState.frameworks.split(",").map((value) => value.trim()).filter(Boolean),
      tags: formState.tags
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      heartbeatIntervalSeconds: Number(formState.heartbeatIntervalSeconds) || 300,
      environmentOverlays: overlays,
    });

    setFormState(initialFormState);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          <span>Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {probe ? (
          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold text-foreground">{probe.name}</p>
              <p className="text-sm text-muted-foreground">{probe.description || "No description supplied."}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{statusText[probe.status] ?? statusText.unknown}</Badge>
              <span className="text-muted-foreground">Owner: {probe.ownerEmail}</span>
              {probe.ownerTeam && <span className="text-muted-foreground">Team: {probe.ownerTeam}</span>}
            </div>
            <Separator />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Frameworks</p>
              <div className="flex flex-wrap gap-1">
                {(probe.frameworkBindings ?? []).map((framework) => (
                  <Badge key={framework} variant="outline">
                    {framework}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Environment overlays</p>
              {environmentOverlays.length === 0 && <p>No overlays configured.</p>}
              {environmentOverlays.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {environmentOverlays.map((overlay) => (
                    <Badge key={overlay} variant="secondary">
                      {overlay}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a probe to inspect metadata.</p>
        )}
        <Separator />
        <form className="space-y-3" onSubmit={handleRegister}>
          <div>
            <Label htmlFor="probe-name">Register new probe</Label>
            <Input id="probe-name" name="name" value={formState.name} onChange={handleFormChange} placeholder="Probe name" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="probe-owner">Owner email</Label>
            <Input id="probe-owner" name="ownerEmail" value={formState.ownerEmail} onChange={handleFormChange} placeholder="owner@example.com" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="probe-frameworks">Framework bindings</Label>
            <Input
              id="probe-frameworks"
              name="frameworks"
              value={formState.frameworks}
              onChange={handleFormChange}
              placeholder="nist-800-53, iso-27001"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="probe-tags">Tags</Label>
            <Input id="probe-tags" name="tags" value={formState.tags} onChange={handleFormChange} placeholder="data, finance" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="probe-heartbeat">Heartbeat interval (seconds)</Label>
            <Input
              id="probe-heartbeat"
              type="number"
              min="60"
              name="heartbeatIntervalSeconds"
              value={formState.heartbeatIntervalSeconds}
              onChange={handleFormChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="probe-overlays">Environment overlays (JSON)</Label>
            <textarea
              id="probe-overlays"
              name="environmentOverlays"
              value={formState.environmentOverlays}
              onChange={handleFormChange}
              placeholder='{"prod": {"region": "us-east-1"}}'
              className="mt-1 min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" disabled={isRegistering} className={cn(isRegistering && "opacity-75")}>Register probe</Button>
        </form>
      </CardContent>
    </Card>
  );
}
