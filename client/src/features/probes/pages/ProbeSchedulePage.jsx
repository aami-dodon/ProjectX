import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { ScheduleEditor } from "@/features/probes/components/ScheduleEditor";
import { fetchProbe } from "@/features/probes/api/probesClient";
import { useProbeSchedules } from "@/features/probes/hooks/useProbeSchedules";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function ProbeSchedulePage() {
  const { probeId } = useParams();
  const { schedules, persistSchedule, isLoading, refresh } = useProbeSchedules(probeId);
  const [probe, setProbe] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadProbe() {
      if (!probeId) return;
      const record = await fetchProbe(probeId);
      if (!cancelled) {
        setProbe(record);
      }
    }

    loadProbe();
    return () => {
      cancelled = true;
    };
  }, [probeId]);

  const handleCreate = async (payload) => {
    setIsSaving(true);
    try {
      await persistSchedule(payload);
      toast.success("Schedule saved");
      refresh();
    } catch (error) {
      toast.error(error?.message ?? "Unable to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ScheduleEditor schedules={schedules} onCreate={handleCreate} isSaving={isSaving} />
      <Card>
        <CardHeader>
          <CardTitle>Next run overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {isLoading && <p>Loading schedules...</p>}
          {!isLoading && schedules.length === 0 && <p>No schedules configured.</p>}
          {!isLoading &&
            schedules.map((schedule) => (
              <div key={schedule.id} className="rounded-md border p-3 text-xs">
                <p className="font-semibold text-foreground">
                  {schedule.type} • {schedule.priority}
                </p>
                <p>Next run: {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleString() : "pending"}</p>
                <p>Last run: {schedule.lastRunAt ? new Date(schedule.lastRunAt).toLocaleString() : "—"}</p>
              </div>
            ))}
          {probe && (
            <p className="text-xs">Default heartbeat: {probe.heartbeatIntervalSeconds ?? 0}s</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
