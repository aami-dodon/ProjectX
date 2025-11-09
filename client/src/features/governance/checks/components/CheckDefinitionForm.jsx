import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, Play, Rocket, Save } from "lucide-react";

import { fetchControls } from "@/features/governance/controls/api/controlsClient";
import { fetchProbes } from "@/features/probes/api/probesClient";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

const DEFAULT_FORM = {
  name: "",
  description: "",
  type: "AUTOMATED",
  severityDefault: "MEDIUM",
  frequency: "",
  probeId: "",
  tags: "",
  controlIds: [],
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
        controlIds: (selectedCheck.controlMappings ?? []).map((mapping) => mapping.controlId),
      });
    } else {
      setFormState({ ...DEFAULT_FORM });
    }
  }, [selectedCheck]);

  const [controlOptions, setControlOptions] = useState([]);
  const [isLoadingControls, setIsLoadingControls] = useState(false);
  const [probeOptions, setProbeOptions] = useState([]);
  const [isLoadingProbes, setIsLoadingProbes] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadControls = async () => {
      setIsLoadingControls(true);
      try {
        const response = await fetchControls({ limit: 100, status: "ACTIVE" });
        if (isMounted) {
          setControlOptions(response.data ?? []);
        }
      } catch (error) {
        console.error("Unable to load controls", error);
      } finally {
        if (isMounted) {
          setIsLoadingControls(false);
        }
      }
    };

    loadControls();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProbes = async () => {
      setIsLoadingProbes(true);
      try {
        const response = await fetchProbes({ limit: 100, status: "ACTIVE" });
        if (isMounted) {
          setProbeOptions(response.data ?? []);
        }
      } catch (error) {
        console.error("Unable to load probes", error);
      } finally {
        if (isMounted) {
          setIsLoadingProbes(false);
        }
      }
    };

    loadProbes();
    return () => {
      isMounted = false;
    };
  }, []);

  const mappedPayload = useMemo(() => {
    const controlMappings = (formState.controlIds ?? []).map((controlId) => ({ controlId }));

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

  const normalizedControlOptions = useMemo(() => {
    if (!formState.controlIds?.length) {
      return controlOptions;
    }
    const missingIds = formState.controlIds.filter(
      (controlId) => !controlOptions.some((control) => control.id === controlId)
    );
    if (!missingIds.length) {
      return controlOptions;
    }
    const placeholders = missingIds.map((id) => ({
      id,
      title: "Linked control",
      slug: id,
    }));
    return [...controlOptions, ...placeholders];
  }, [controlOptions, formState.controlIds]);

  const controlLookup = useMemo(
    () =>
      normalizedControlOptions.reduce((acc, control) => {
        acc[control.id] = control;
        return acc;
      }, {}),
    [normalizedControlOptions]
  );

  const normalizedProbeOptions = useMemo(() => {
    if (!formState.probeId || probeOptions.some((probe) => probe.id === formState.probeId)) {
      return probeOptions;
    }
    return [...probeOptions, { id: formState.probeId, name: "Linked probe" }];
  }, [probeOptions, formState.probeId]);

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
              <Select
                value={formState.probeId || "__none"}
                onValueChange={(value) => handleChange("probeId", value === "__none" ? "" : value)}
                disabled={isLoadingProbes}
              >
                <SelectTrigger id="check-probe">
                  <SelectValue placeholder={isLoadingProbes ? "Loading probes…" : "Select a probe"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No probe</SelectItem>
                  {normalizedProbeOptions.map((probe) => (
                    <SelectItem key={probe.id} value={probe.id}>
                      {probe.name ?? probe.slug ?? probe.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <ControlSelector
            value={formState.controlIds}
            options={normalizedControlOptions}
            optionLookup={controlLookup}
            onChange={(value) => handleChange("controlIds", value)}
            isLoading={isLoadingControls}
          />

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

function ControlSelector({ value = [], options = [], optionLookup = {}, onChange, isLoading }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search.trim()) {
      return options;
    }
    const term = search.trim().toLowerCase();
    return options.filter((option) => {
      const label = option.title ?? option.slug ?? option.id ?? "";
      return label.toLowerCase().includes(term);
    });
  }, [options, search]);

  const toggleValue = (controlId) => {
    if (!controlId) {
      return;
    }
    const nextValue = value.includes(controlId)
      ? value.filter((id) => id !== controlId)
      : [...value, controlId];
    onChange?.(nextValue);
  };

  return (
    <div className="space-y-2">
      <Label>Controls</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between">
            <span>
              {value.length
                ? `${value.length} selected`
                : isLoading
                  ? "Loading controls…"
                  : "Select controls"}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-0">
          <div className="border-b p-2">
            <Input
              placeholder="Search controls"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <ScrollArea className="max-h-64 p-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading controls…</p>
            ) : filteredOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No controls found.</p>
            ) : (
              filteredOptions.map((control) => (
                <label
                  key={control.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1 text-left hover:bg-muted"
                >
                  <Checkbox
                    checked={value.includes(control.id)}
                    onCheckedChange={() => toggleValue(control.id)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {control.title ?? control.slug ?? control.id}
                    </p>
                    <p className="text-xs text-muted-foreground">{control.slug ?? control.id}</p>
                  </div>
                </label>
              ))
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {value.length ? (
        <div className="flex flex-wrap gap-1">
          {value.map((controlId) => {
            const summary = optionLookup[controlId];
            return (
              <Badge key={controlId} variant="outline">
                {summary?.title ?? summary?.slug ?? controlId}
              </Badge>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Link controls to ensure coverage reporting stays accurate.</p>
      )}
    </div>
  );
}
