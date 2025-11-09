import { useEffect, useMemo, useState } from "react";
import { Archive, Save } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

const DEFAULT_FORM = {
  slug: "",
  title: "",
  description: "",
  domain: "",
  category: "",
  subCategory: "",
  ownerTeam: "",
  riskTier: "MEDIUM",
  enforcementLevel: "ADVISORY",
  status: "DRAFT",
  tags: "",
  remediationNotes: "",
};

export function ControlForm({
  selectedControl,
  onCreate,
  onSave,
  onArchive,
  isSubmitting = false,
  isArchiving = false,
}) {
  const [formState, setFormState] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (selectedControl) {
      setFormState({
        slug: selectedControl.slug ?? "",
        title: selectedControl.title ?? "",
        description: selectedControl.description ?? "",
        domain: selectedControl.taxonomy?.domain ?? "",
        category: selectedControl.taxonomy?.category ?? "",
        subCategory: selectedControl.taxonomy?.subCategory ?? "",
        ownerTeam: selectedControl.ownerTeam ?? "",
        riskTier: selectedControl.riskTier ?? "MEDIUM",
        enforcementLevel: selectedControl.enforcementLevel ?? "ADVISORY",
        status: selectedControl.status ?? "DRAFT",
        tags: (selectedControl.tags ?? []).join(", "),
        remediationNotes: selectedControl.remediationNotes ?? "",
      });
    } else {
      setFormState(DEFAULT_FORM);
    }
  }, [selectedControl]);

  const mappedPayload = useMemo(() => {
    const tags = (formState.tags ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    return {
      slug: formState.slug,
      title: formState.title,
      description: formState.description,
      domain: formState.domain,
      category: formState.category,
      subCategory: formState.subCategory,
      ownerTeam: formState.ownerTeam,
      riskTier: formState.riskTier,
      enforcementLevel: formState.enforcementLevel,
      status: formState.status,
      tags,
      remediationNotes: formState.remediationNotes,
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
    if (selectedControl && typeof onSave === "function") {
      await onSave(selectedControl.id, mappedPayload);
    } else if (typeof onCreate === "function") {
      await onCreate(mappedPayload);
    }
  };

  const handleArchive = async () => {
    if (!selectedControl || typeof onArchive !== "function") return;
    const reason = window.prompt("Provide a short rationale for archiving this control:");
    if (!reason) return;
    await onArchive(selectedControl.id, { reason });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{selectedControl ? "Control Designer" : "New Control"}</CardTitle>
        <CardDescription>
          {selectedControl
            ? "Update taxonomy, risk posture, or enforcement metadata."
            : "Capture baseline metadata before mapping frameworks and checks."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Slug" required>
              <Input
                value={formState.slug}
                onChange={(event) => handleChange("slug", event.target.value)}
                placeholder="ml-model-fairness"
                required
                disabled={Boolean(selectedControl)}
              />
            </Field>
            <Field label="Owner" hint="Responsible team or function">
              <Input value={formState.ownerTeam} onChange={(event) => handleChange("ownerTeam", event.target.value)} />
            </Field>
          </div>
          <Field label="Title" required>
            <Input
              value={formState.title}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="AI Fairness Control"
              required
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={formState.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Explain the intent, rationale, and implementation guidance."
              rows={3}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Domain">
              <Input value={formState.domain} onChange={(event) => handleChange("domain", event.target.value)} />
            </Field>
            <Field label="Category">
              <Input value={formState.category} onChange={(event) => handleChange("category", event.target.value)} />
            </Field>
            <Field label="Sub-category">
              <Input value={formState.subCategory} onChange={(event) => handleChange("subCategory", event.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Risk tier">
              <Select value={formState.riskTier} onValueChange={(value) => handleChange("riskTier", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['LOW', 'MEDIUM', 'HIGH'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Enforcement">
              <Select
                value={formState.enforcementLevel}
                onValueChange={(value) => handleChange("enforcementLevel", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['ADVISORY', 'MANDATORY'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={formState.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['DRAFT', 'ACTIVE', 'DEPRECATED'].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Tags" hint="Comma separated list">
            <Input value={formState.tags} onChange={(event) => handleChange("tags", event.target.value)} />
          </Field>
          <Field label="Remediation notes">
            <Textarea
              rows={2}
              value={formState.remediationNotes}
              onChange={(event) => handleChange("remediationNotes", event.target.value)}
              placeholder="Escalation handling, compensating controls, playbooks"
            />
          </Field>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 size-4" />
              {selectedControl ? "Update Control" : "Create Control"}
            </Button>
            {selectedControl && selectedControl.status !== "DEPRECATED" ? (
              <Button
                type="button"
                variant="outline"
                disabled={isArchiving}
                onClick={handleArchive}
                className="ml-auto"
              >
                <Archive className="mr-2 size-4" /> Archive
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, hint, children, required }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <Label className="font-medium">
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
        {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
