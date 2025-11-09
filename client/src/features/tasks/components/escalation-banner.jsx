import { IconAlertTriangle, IconCircleCheck, IconClockHour5 } from "@tabler/icons-react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

const STATE_VARIANTS = {
  overdue: {
    wrapper: "border-destructive/40 bg-destructive/10 text-destructive",
    icon: <IconAlertTriangle className="size-4" />,
    label: "Overdue",
    description: "The SLA has been breached. Escalation is recommended.",
  },
  atRisk: {
    wrapper: "border-amber-400 bg-amber-50 text-amber-900",
    icon: <IconClockHour5 className="size-4" />,
    label: "At risk",
    description: "The due date is approaching. Monitor progress closely.",
  },
  healthy: {
    wrapper: "border-emerald-400 bg-emerald-50 text-emerald-900",
    icon: <IconCircleCheck className="size-4" />,
    label: "On track",
    description: "This task is tracking within the current SLA window.",
  },
};

export function EscalationBanner({ task, metrics, onEscalate }) {
  const state = STATE_VARIANTS[task?.slaState ?? "healthy"] ?? STATE_VARIANTS.healthy;
  const dueAt = task?.slaDueAt ? new Date(task.slaDueAt).toLocaleString() : "Not specified";
  const escalationLevel = task?.escalationLevel ?? 0;

  return (
    <div className={cn("rounded-md border p-4", state.wrapper)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            {state.icon}
            <span>{state.label}</span>
            <span className="text-xs text-muted-foreground">Escalation level {escalationLevel}</span>
          </div>
          <p className="text-sm opacity-90">{state.description}</p>
          <p className="mt-1 text-xs">
            SLA due {dueAt}. Active tasks: {metrics?.activeTotal ?? "–"} · Overdue: {metrics?.overdue ?? "–"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEscalate} disabled={!onEscalate}>
            Notify owner
          </Button>
          <Button variant="secondary" size="sm" onClick={onEscalate} disabled={!onEscalate}>
            Escalate
          </Button>
        </div>
      </div>
    </div>
  );
}
