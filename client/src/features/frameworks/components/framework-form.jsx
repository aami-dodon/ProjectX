import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "RETIRED", label: "Retired" },
];

const mapInitialValues = (initialValues = {}) => ({
  slug: initialValues.slug ?? "",
  title: initialValues.title ?? "",
  description: initialValues.description ?? "",
  domain: initialValues.domain ?? "",
  jurisdiction: initialValues.jurisdiction ?? "",
  publisher: initialValues.publisher ?? "",
  status: initialValues.status ?? "DRAFT",
  validFrom: initialValues.validFrom ? initialValues.validFrom.slice(0, 10) : "",
  validTo: initialValues.validTo ? initialValues.validTo.slice(0, 10) : "",
  tags: (initialValues.tags ?? []).join(", "),
  metadata: initialValues.metadata ? JSON.stringify(initialValues.metadata, null, 2) : "",
  version: initialValues.activeVersion?.version ?? initialValues.version ?? "1.0.0",
  changelog: initialValues.activeVersion?.changelog ?? "",
});

export function FrameworkForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Save Framework",
}) {
  const [formState, setFormState] = useState(() => mapInitialValues(initialValues));
  const [error, setError] = useState(null);

  useEffect(() => {
    setFormState(mapInitialValues(initialValues));
  }, [initialValues]);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSelect = (field) => (value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    let metadataPayload = null;
    if (formState.metadata?.trim()) {
      try {
        metadataPayload = JSON.parse(formState.metadata);
      } catch {
        setError("Metadata must be valid JSON.");
        return;
      }
    }

    const payload = {
      slug: formState.slug.trim(),
      title: formState.title.trim(),
      description: formState.description?.trim() || undefined,
      domain: formState.domain?.trim() || undefined,
      jurisdiction: formState.jurisdiction?.trim() || undefined,
      publisher: formState.publisher?.trim() || undefined,
      status: formState.status,
      validFrom: formState.validFrom || undefined,
      validTo: formState.validTo || undefined,
      tags: formState.tags
        ? formState.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined,
      metadata: metadataPayload ?? undefined,
      version: formState.version,
      changelog: formState.changelog?.trim() || undefined,
    };

    await onSubmit?.(payload);
  };

  return (
    <Card as="form" onSubmit={handleSubmit} className="space-y-4">
      <CardHeader>
        <CardTitle>Framework metadata</CardTitle>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Slug" description="Unique identifier used by APIs.">
            <Input value={formState.slug} onChange={handleChange("slug")} required />
          </Field>
          <Field label="Title">
            <Input value={formState.title} onChange={handleChange("title")} required />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={formState.description} onChange={handleChange("description")} rows={3} />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Domain">
            <Input value={formState.domain} onChange={handleChange("domain")} />
          </Field>
          <Field label="Jurisdiction">
            <Input value={formState.jurisdiction} onChange={handleChange("jurisdiction")} />
          </Field>
          <Field label="Publisher">
            <Input value={formState.publisher} onChange={handleChange("publisher")} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Status">
            <Select value={formState.status} onValueChange={handleSelect("status")}>
              <SelectTrigger>
                <SelectValue placeholder="Pick status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Valid from">
            <Input type="date" value={formState.validFrom} onChange={handleChange("validFrom")} />
          </Field>
          <Field label="Valid to">
            <Input type="date" value={formState.validTo} onChange={handleChange("validTo")} />
          </Field>
        </div>
        <Field label="Tags" description="Comma-separated keywords for saved views.">
          <Input value={formState.tags} onChange={handleChange("tags")} placeholder="privacy, soc2" />
        </Field>
        <Field label="Version" description="Tracks the semantic version for the next publish.">
          <Input value={formState.version} onChange={handleChange("version")} />
        </Field>
        <Field label="Changelog">
          <Textarea value={formState.changelog} onChange={handleChange("changelog")} rows={3} />
        </Field>
        <Field label="Metadata" description="Provide JSON with locale or weighting hints.">
          <Textarea value={formState.metadata} onChange={handleChange("metadata")} rows={4} placeholder='{"regulator":"SEBI"}' />
        </Field>
      </CardContent>
      <CardFooter className="flex items-center gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}

function Field({ label, description, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
