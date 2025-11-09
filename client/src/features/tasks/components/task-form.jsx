import { useMemo, useState } from "react";
import { IconClockHour4, IconUserPlus } from "@tabler/icons-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const SOURCE_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "CHECK_FAILURE", label: "Failed check" },
  { value: "CONTROL_REMEDIATION", label: "Control remediation" },
  { value: "IMPORT", label: "Imported" },
  { value: "OTHER", label: "Other" },
];

const DEFAULT_VALUES = {
  title: "",
  description: "",
  priority: "MEDIUM",
  source: "MANUAL",
  controlId: "",
  checkId: "",
  frameworkId: "",
  assigneeId: "",
  teamId: "",
  slaDueAt: "",
};

export function TaskForm({ initialValues = {}, onSubmit, onCancel, isSubmitting = false, className }) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues });
  const [touched, setTouched] = useState({});

  const derived = useMemo(() => ({
    canSubmit: Boolean(values.title?.trim()),
  }), [values.title]);

  const handleChange = (field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({ title: true });

    if (!derived.canSubmit || typeof onSubmit !== "function") {
      return;
    }

    const payload = {
      title: values.title?.trim(),
      description: values.description?.trim() || undefined,
      priority: values.priority,
      source: values.source,
      controlId: values.controlId?.trim() || undefined,
      checkId: values.checkId?.trim() || undefined,
      frameworkId: values.frameworkId?.trim() || undefined,
      assigneeId: values.assigneeId?.trim() || undefined,
      teamId: values.teamId?.trim() || undefined,
      slaDueAt: values.slaDueAt ? new Date(values.slaDueAt).toISOString() : undefined,
    };

    onSubmit(payload);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Create remediation task</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="e.g., Patch critical dependency"
                value={values.title}
                onChange={(event) => handleChange("title", event.target.value)}
              />
              {!values.title?.trim() && touched.title ? (
                <p className="text-xs text-destructive">Title is required.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Add context, acceptance criteria, or remediation details"
                value={values.description}
                onChange={(event) => handleChange("description", event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="task-priority">
                <IconClockHour4 className="size-4 text-muted-foreground" /> Priority
              </Label>
              <Select value={values.priority} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger id="task-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-source">Source</Label>
              <Select value={values.source} onValueChange={(value) => handleChange("source", value)}>
                <SelectTrigger id="task-source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2" htmlFor="task-assignee">
                <IconUserPlus className="size-4 text-muted-foreground" /> Assignee ID
              </Label>
              <Input
                id="task-assignee"
                placeholder="Paste the user UUID"
                value={values.assigneeId}
                onChange={(event) => handleChange("assigneeId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-team">Team</Label>
              <Input
                id="task-team"
                placeholder="Optional team slug"
                value={values.teamId}
                onChange={(event) => handleChange("teamId", event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="task-control">Control ID</Label>
              <Input
                id="task-control"
                placeholder="Control UUID"
                value={values.controlId}
                onChange={(event) => handleChange("controlId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-check">Check ID</Label>
              <Input
                id="task-check"
                placeholder="Check UUID"
                value={values.checkId}
                onChange={(event) => handleChange("checkId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-framework">Framework ID</Label>
              <Input
                id="task-framework"
                placeholder="Framework UUID"
                value={values.frameworkId}
                onChange={(event) => handleChange("frameworkId", event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-sla">SLA due date</Label>
            <Input
              id="task-sla"
              type="datetime-local"
              value={values.slaDueAt}
              onChange={(event) => handleChange("slaDueAt", event.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!derived.canSubmit || isSubmitting}>
            {isSubmitting ? "Saving..." : "Create task"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
