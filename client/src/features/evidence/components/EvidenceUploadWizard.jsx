import { useEffect, useMemo, useState } from "react";
import { IconShieldPlus } from "@tabler/icons-react";
import { toast } from "sonner";

import { useEvidenceUpload } from "@/features/evidence/hooks/useEvidenceUpload";
import { fetchControls } from "@/features/governance/controls/api/controlsClient";
import { fetchChecks } from "@/features/governance/checks/api/checksClient";
import { fetchTasks } from "@/features/tasks/api/tasks-client";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { MultiSelect } from "@/shared/components/ui/multi-select";

const RETENTION_STATES = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archive when reviewed" },
  { value: "LEGAL_HOLD", label: "Legal hold" },
  { value: "PURGE_SCHEDULED", label: "Purge scheduled" },
];

export function EvidenceUploadWizard({ onCompleted }) {
  const {
    formState,
    selectedFile,
    checksum,
    isSubmitting,
    error,
    setSelectedFile,
    updateField,
    computeChecksum,
    submit,
    reset,
  } = useEvidenceUpload({ onSuccess: onCompleted });
  const [fileError, setFileError] = useState(null);
  const [controlOptions, setControlOptions] = useState([]);
  const [checkOptions, setCheckOptions] = useState([]);
  const [taskOptions, setTaskOptions] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState({
    controls: false,
    checks: false,
    tasks: false,
  });

  useEffect(() => {
    let isMounted = true;

    const loadControls = async () => {
      setIsLoadingOptions((previous) => ({ ...previous, controls: true }));
      try {
        const response = await fetchControls({ limit: 100, status: "ACTIVE" });
        if (isMounted) {
          setControlOptions(response.data ?? []);
        }
      } catch (error) {
        console.error("Unable to load control options", error);
      } finally {
        if (isMounted) {
          setIsLoadingOptions((previous) => ({ ...previous, controls: false }));
        }
      }
    };

    const loadChecks = async () => {
      setIsLoadingOptions((previous) => ({ ...previous, checks: true }));
      try {
        const response = await fetchChecks({ limit: 100, status: "ACTIVE" });
        if (isMounted) {
          setCheckOptions(response.data ?? []);
        }
      } catch (error) {
        console.error("Unable to load check options", error);
      } finally {
        if (isMounted) {
          setIsLoadingOptions((previous) => ({ ...previous, checks: false }));
        }
      }
    };

    const loadTasks = async () => {
      setIsLoadingOptions((previous) => ({ ...previous, tasks: true }));
      try {
        const response = await fetchTasks({ limit: 100, offset: 0, sort: "createdAt:desc" });
        if (isMounted) {
          setTaskOptions(response.data ?? []);
        }
      } catch (error) {
        console.error("Unable to load task options", error);
      } finally {
        if (isMounted) {
          setIsLoadingOptions((previous) => ({ ...previous, tasks: false }));
        }
      }
    };

    loadControls();
    loadChecks();
    loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const controlOptionsWithSelection = useMemo(
    () => ensureOptionCoverage(formState.controlIds, controlOptions, (id) => ({ id, title: "Linked control" })),
    [controlOptions, formState.controlIds]
  );

  const checkOptionsWithSelection = useMemo(
    () => ensureOptionCoverage(formState.checkIds, checkOptions, (id) => ({ id, name: "Linked check" })),
    [checkOptions, formState.checkIds]
  );

  const taskOptionsWithSelection = useMemo(
    () =>
      ensureOptionCoverage(formState.taskReferences, taskOptions, (id) => ({
        id,
        title: "Linked task",
      })),
    [formState.taskReferences, taskOptions]
  );

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setFileError(null);
    if (!file) {
      return;
    }

    try {
      await computeChecksum(file);
    } catch (err) {
      setFileError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const record = await submit();
      toast.success(`${record?.name ?? "Evidence"} uploaded`);
      reset();
    } catch (err) {
      toast.error(err?.message ?? "Unable to upload evidence");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconShieldPlus className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Upload evidence</CardTitle>
            <p className="text-sm text-muted-foreground">
              Capture metadata, calculate hashes, and stream the artifact directly to storage.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="evidence-file">Select file</Label>
            <Input id="evidence-file" type="file" accept=".pdf,.zip,.png,.jpg,.jpeg,.webp,.txt,.xlsx,.xls" onChange={handleFileChange} />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} · {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
            {(error || fileError) && (
              <p className="text-xs text-destructive">{error?.message ?? fileError}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="upload-description">Description</Label>
              <Textarea
                id="upload-description"
                rows={5}
                value={formState.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder="Summarise what this evidence proves and how it was collected."
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upload-tags">Tags</Label>
                <Input
                  id="upload-tags"
                  value={formState.tags}
                  onChange={(event) => updateField("tags", event.target.value)}
                  placeholder="risk, q4, payroll"
                />
              </div>
              <MultiSelect
                label="Control IDs"
                placeholder={isLoadingOptions.controls ? "Loading controls…" : "Select controls"}
                value={formState.controlIds}
                options={controlOptionsWithSelection}
                onChange={(selection) => updateField("controlIds", selection)}
                isLoading={isLoadingOptions.controls}
                getOptionValue={(option) => option.id}
                getOptionLabel={(option) => option.title ?? option.slug ?? option.id}
                getOptionDescription={(option) => option.slug ?? option.id}
              />
              <MultiSelect
                label="Check IDs"
                placeholder={isLoadingOptions.checks ? "Loading checks…" : "Select checks"}
                value={formState.checkIds}
                options={checkOptionsWithSelection}
                onChange={(selection) => updateField("checkIds", selection)}
                isLoading={isLoadingOptions.checks}
                getOptionValue={(option) => option.id}
                getOptionLabel={(option) => option.name ?? option.slug ?? option.id}
                getOptionDescription={(option) => option.type ? `${option.type} • ${option.status}` : option.slug ?? option.id}
              />
              <div className="space-y-2">
                <Label>Retention state</Label>
                <Select value={formState.retentionState} onValueChange={(value) => updateField("retentionState", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Active" />
                  </SelectTrigger>
                  <SelectContent>
                    {RETENTION_STATES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MultiSelect
              label="Task references"
              placeholder={isLoadingOptions.tasks ? "Loading tasks…" : "Select tasks"}
              value={formState.taskReferences}
              options={taskOptionsWithSelection}
              onChange={(selection) => updateField("taskReferences", selection)}
              isLoading={isLoadingOptions.tasks}
              getOptionValue={(option) => option.id}
              getOptionLabel={(option) => option.title ?? option.id}
              getOptionDescription={(option) =>
                option.priority ? `${option.priority} • ${option.status ?? "PENDING"}` : option.id
              }
              description="Task references help downstream workflows trace remediation ownership."
            />
            <div className="space-y-2">
              <Label htmlFor="upload-checksum">Checksum (SHA-256)</Label>
              <Input id="upload-checksum" value={checksum} readOnly placeholder="Calculated automatically" />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || !selectedFile} className="w-full md:w-auto">
            {isSubmitting ? "Uploading" : "Generate upload"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ensureOptionCoverage(selectedValues = [], options = [], factory) {
  if (!Array.isArray(selectedValues) || !selectedValues.length) {
    return options;
  }

  const missing = selectedValues.filter(
    (selected) => !options.some((option) => (option.id ?? option.value) === selected)
  );

  if (!missing.length) {
    return options;
  }

  const placeholders = missing.map((id) => {
    const fallback = factory?.(id);
    return fallback ?? { id, title: id };
  });

  return [...options, ...placeholders];
}
