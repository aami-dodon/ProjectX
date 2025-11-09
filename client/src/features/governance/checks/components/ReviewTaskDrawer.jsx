import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

const STATUS_OPTIONS = ["PASS", "FAIL", "WARNING", "PENDING_REVIEW", "ERROR"];
const SEVERITY_OPTIONS = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const DECISION_OPTIONS = ["APPROVED", "REJECTED", "CHANGES_REQUESTED"];

export function ReviewTaskDrawer({ task, open, onOpenChange, onSubmit, isSubmitting }) {
  const [formState, setFormState] = useState({
    decision: "APPROVED",
    status: task?.result?.status ?? "PASS",
    severity: task?.result?.severity ?? "MEDIUM",
    notes: "",
    publish: true,
    evidenceBundleId: task?.metadata?.evidenceBundleId ?? "",
  });

  useEffect(() => {
    if (!task) {
      return;
    }

    setFormState({
      decision: "APPROVED",
      status: task.result?.status ?? "PASS",
      severity: task.result?.severity ?? "MEDIUM",
      notes: "",
      publish: true,
      evidenceBundleId: task.metadata?.evidenceBundleId ?? "",
    });
  }, [task]);

  const handleChange = (field, value) => {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit?.(formState);
    setFormState((previous) => ({ ...previous, notes: "" }));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Review Task</DrawerTitle>
          <DrawerDescription>
            {task?.check?.name} • {task?.priority} priority • Due {task?.dueAt ? new Date(task.dueAt).toLocaleString() : "—"}
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Decision">
                <Select value={formState.decision} onValueChange={(value) => handleChange("decision", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Publish after review">
                <Select
                  value={formState.publish ? "true" : "false"}
                  onValueChange={(value) => handleChange("publish", value === "true")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Publish immediately</SelectItem>
                    <SelectItem value="false">Keep as validated</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Result Status">
                <Select value={formState.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Severity">
                <Select value={formState.severity} onValueChange={(value) => handleChange("severity", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Reviewer notes">
              <Textarea
                value={formState.notes}
                onChange={(event) => handleChange("notes", event.target.value)}
                placeholder="Capture context, escalation guidance, or evidence references."
                rows={4}
              />
            </Field>
            <Field label="Evidence bundle (optional)">
              <Input
                placeholder="Link to evidence bundle"
                value={formState.evidenceBundleId ?? ""}
                onChange={(event) => handleChange("evidenceBundleId", event.target.value)}
              />
            </Field>
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={isSubmitting}>
              Complete Review
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
