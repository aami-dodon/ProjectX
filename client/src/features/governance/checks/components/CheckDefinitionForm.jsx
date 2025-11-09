import { useEffect, useMemo, useState } from "react";
import { Play, Rocket, Save } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";

const DEFAULT_FORM = {
  name: "",
  description: "",
  type: "AUTOMATED",
  severityDefault: "MEDIUM",
  frequency: "",
  probeId: "",
  tags: "",
  controlIds: "",
};

export function CheckDefinitionForm({
  selectedCheck,
  onSave,
  onCreate,
  onActivate,
  onRun,
  isSubmitting = false,
  isActivating = false,
  isRunning = false,
}) {
  const [formState, setFormState] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (selectedCheck) {
      setFormState({
        name: selectedCheck.name ?? "",
        description: selectedCheck.description ?? "",
        type: selectedCheck.type ?? "AUTOMATED",
        severityDefault: selectedCheck.severityDefault ?? "MEDIUM",
        frequency: selectedCheck.frequency ?? "",
        probeId: selectedCheck.probeId ?? "",
        tags: (selectedCheck.tags ?? []).join(", "),
        controlIds: (selectedCheck.controlMappings ?? []).map((mapping) => mapping.controlId).join(", "),
      });
    } else {
      setFormState(DEFAULT_FORM);
    }
  }, [selectedCheck]);

  const mappedPayload = useMemo(() => {
    const controlMappings = (formState.controlIds ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((controlId) => ({ controlId }));

    const tags = (formState.tags ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    return {
      name: formState.name,
      description: formState.description,
      type: formState.type,
      severityDefault: formState.severityDefault,
      frequency: formState.frequency,
      probeId: formState.probeId || undefined,
      tags,
      controlMappings,
    };
  }, [formState]);

  const handleChange = (field, value) => {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedCheck && typeof onSave === "function") {
      await onSave(selectedCheck.id, mappedPayload);
    } else if (typeof onCreate === "function") {
      await onCreate(mappedPayload);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{selectedCheck ? "Definition Designer" : "New Check"}</CardTitle>
        <CardDescription>
          {selectedCheck
            ? "Update metadata, severity defaults, and control links before activating."
            : "Capture control coverage and automation metadata to seed a new definition."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="check-name">Name</Label>
            <Input
              id="check-name"
              value={formState.name}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder="e.g., Model Fairness Drift"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="check-description">Description</Label>
            <Textarea
              id="check-description"
              value={formState.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Describe what this check validates and why it matters."
              rows={3}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formState.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTOMATED">Automated</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Severity</Label>
              <Select
                value={formState.severityDefault}
                onValueChange={(value) => handleChange("severityDefault", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="check-frequency">Cadence</Label>
              <Input
                id="check-frequency"
                value={formState.frequency}
                onChange={(event) => handleChange("frequency", event.target.value)}
                placeholder="e.g., daily, weekly, PT4H"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check-probe">Probe Identifier (optional)</Label>
              <Input
                id="check-probe"
                value={formState.probeId}
                onChange={(event) => handleChange("probeId", event.target.value)}
                placeholder="UUID or slug"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="check-tags">Tags</Label>
            <Input
              id="check-tags"
              value={formState.tags}
              onChange={(event) => handleChange("tags", event.target.value)}
              placeholder="risk, bias, finance"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="check-controls">Controls</Label>
            <Textarea
              id="check-controls"
              value={formState.controlIds}
              onChange={(event) => handleChange("controlIds", event.target.value)}
              placeholder="Enter comma separated control IDs"
              rows={2}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 size-4" />
              {selectedCheck ? "Update Definition" : "Create Definition"}
            </Button>
            {selectedCheck?.status === "READY_FOR_VALIDATION" ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isActivating}
                onClick={() => onActivate?.(selectedCheck.id)}
              >
                <Rocket className="mr-2 size-4" />
                Activate
              </Button>
            ) : null}
            {selectedCheck?.status === "ACTIVE" ? (
              <Button
                type="button"
                variant="outline"
                disabled={isRunning}
                onClick={() => onRun?.(selectedCheck.id, { triggerSource: "console" })}
              >
                <Play className="mr-2 size-4" />
                Run Ad-hoc
              </Button>
            ) : null}
            {selectedCheck ? (
              <Badge className="ml-auto" variant="outline">
                Version {selectedCheck.version ?? 1} • {selectedCheck.status}
              </Badge>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
