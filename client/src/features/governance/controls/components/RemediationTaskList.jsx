import { useState } from "react";
import { AlarmClock, Send } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

const PRIORITIES = ["normal", "high", "urgent"];

export function RemediationTaskList({ history = [], onTrigger, isTriggering = false }) {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("normal");

  const handleTrigger = async (event) => {
    event.preventDefault();
    if (!reason.trim() || typeof onTrigger !== "function") return;
    await onTrigger({ reason: reason.trim(), priority });
    setReason("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Remediation</CardTitle>
        <CardDescription>Open operational tasks when controls slip below thresholds.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 md:grid-cols-3" onSubmit={handleTrigger}>
          <div className="md:col-span-2 space-y-2">
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe the remediation trigger"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button type="submit" disabled={isTriggering || !reason.trim()}>
              <Send className="mr-2 size-4" /> Trigger remediation
            </Button>
          </div>
        </form>
        <div className="space-y-3">
          {history.length ? (
            history.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between rounded-md border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{entry.reason ?? entry.comment ?? "Remediation"}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.priority ?? "normal"} • {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlarmClock className="size-3" />
                  {entry.taskId ?? entry.id}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No remediation events recorded.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
