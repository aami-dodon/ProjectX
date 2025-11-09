import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

const RETENTION_STATES = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "LEGAL_HOLD", label: "Legal hold" },
  { value: "PURGE_SCHEDULED", label: "Purge scheduled" },
];

const formatBytes = (value) => {
  if (!value && value !== 0) return "—";
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export function EvidenceMetadataPanel({ evidence, onSave, isSaving = false }) {
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [retentionState, setRetentionState] = useState("ACTIVE");

  useEffect(() => {
    setDescription(evidence?.description ?? "");
    setTagInput((evidence?.tags ?? []).join(", "));
    setRetentionState(evidence?.retentionState ?? "ACTIVE");
  }, [evidence?.description, evidence?.retentionState, evidence?.tags]);

  const metadataSummary = useMemo(() => [
    { label: "Size", value: formatBytes(evidence?.size) },
    { label: "MIME type", value: evidence?.mimeType ?? "—" },
    { label: "Checksum", value: evidence?.checksum ?? "—" },
  ], [evidence?.checksum, evidence?.mimeType, evidence?.size]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const tags = tagInput
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    onSave?.({
      description: description || undefined,
      tags,
      retentionState,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            {metadataSummary.map((item) => (
              <div key={item.label}>
                <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium break-all">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="evidence-description">Description</Label>
            <Textarea
              id="evidence-description"
              value={description}
              placeholder="Add reviewer context, capture what is contained in the evidence, or note applicable controls."
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evidence-tags">Tags</Label>
            <Input
              id="evidence-tags"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="risk, q1, payroll"
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {(evidence?.tags ?? []).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Retention state</Label>
            <Select value={retentionState} onValueChange={setRetentionState}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {RETENTION_STATES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Policy: {evidence?.retentionPolicy?.name ?? "Standard"} ({evidence?.retentionPolicy?.retentionMonths ?? 36} months)
            </p>
          </div>
          <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
            {isSaving ? "Saving" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
