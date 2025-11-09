import { useState } from "react";
import { IconShieldPlus } from "@tabler/icons-react";
import { toast } from "sonner";

import { useEvidenceUpload } from "@/features/evidence/hooks/useEvidenceUpload";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

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
              <div className="space-y-2">
                <Label htmlFor="upload-controls">Control IDs</Label>
                <Input
                  id="upload-controls"
                  value={formState.controlIds}
                  onChange={(event) => updateField("controlIds", event.target.value)}
                  placeholder="comma-separated UUIDs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload-checks">Check IDs</Label>
                <Input
                  id="upload-checks"
                  value={formState.checkIds}
                  onChange={(event) => updateField("checkIds", event.target.value)}
                  placeholder="comma-separated UUIDs"
                />
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="upload-tasks">Task references</Label>
              <Input
                id="upload-tasks"
                value={formState.taskReferences}
                onChange={(event) => updateField("taskReferences", event.target.value)}
                placeholder="ticket-42"
              />
            </div>
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
