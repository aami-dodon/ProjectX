import { useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";

const SCHEDULE_TYPES = [
  { value: "cron", label: "Cron" },
  { value: "event", label: "Event" },
  { value: "adhoc", label: "Ad-hoc" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function ScheduleEditor({ schedules = [], onCreate, isSaving }) {
  const [formState, setFormState] = useState({
    type: "cron",
    expression: "0 */6 * * *",
    priority: "normal",
    controls: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreate?.({
      type: formState.type,
      expression: formState.expression,
      priority: formState.priority,
      controls: formState.controls
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    });
    setFormState((prev) => ({ ...prev, controls: "" }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <div className="w-1/2 space-y-1">
              <Label>Type</Label>
              <Select value={formState.type} onValueChange={(value) => setFormState((prev) => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2 space-y-1">
              <Label>Priority</Label>
              <Select value={formState.priority} onValueChange={(value) => setFormState((prev) => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Cron / Event expression</Label>
            <Input name="expression" value={formState.expression} onChange={handleChange} className="mt-1" />
            <p className="text-xs text-muted-foreground">Use standard cron syntax for recurring probes.</p>
          </div>
          <div>
            <Label>Controls (comma separated)</Label>
            <Input name="controls" value={formState.controls} onChange={handleChange} className="mt-1" />
          </div>
          <Button type="submit" disabled={isSaving} className="w-full">
            Save schedule
          </Button>
        </form>
        <Separator />
        <div className="space-y-3">
          {schedules.length === 0 && <p className="text-sm text-muted-foreground">No active schedules.</p>}
          {schedules.map((schedule) => (
            <div key={schedule.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{schedule.type}</span>
                <Badge variant="secondary">{schedule.priority}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{schedule.expression || "Event-driven"}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(schedule.controls ?? []).map((control) => (
                  <Badge key={control} variant="outline">
                    {control}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
