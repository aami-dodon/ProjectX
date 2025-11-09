import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { IconArrowLeft, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { EvidenceAttachmentList } from "@/features/tasks/components/evidence-attachment-list";
import { EscalationBanner } from "@/features/tasks/components/escalation-banner";
import { ExternalSyncStatus } from "@/features/tasks/components/external-sync-status";
import { TaskTimeline } from "@/features/tasks/components/task-timeline";
import { useTaskDetail } from "@/features/tasks/hooks/use-task-detail";
import { useTaskMutations } from "@/features/tasks/hooks/use-task-mutations";
import { useSlaMetrics } from "@/features/tasks/hooks/use-sla-metrics";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";

const STATUS_ACTIONS = [
  { from: ["OPEN", "AWAITING_EVIDENCE"], label: "Start progress", status: "IN_PROGRESS" },
  { from: ["IN_PROGRESS", "AWAITING_EVIDENCE"], label: "Await evidence", status: "AWAITING_EVIDENCE" },
  { from: ["IN_PROGRESS", "AWAITING_EVIDENCE"], label: "Request verification", status: "PENDING_VERIFICATION" },
  { from: ["PENDING_VERIFICATION", "RESOLVED"], label: "Resolve", status: "RESOLVED", icon: <IconCheck className="mr-2 size-4" /> },
  { from: ["RESOLVED"], label: "Close", status: "CLOSED" },
];

const FIELD_ROWS = [
  { label: "Priority", accessor: (task) => task?.priority ?? "" },
  { label: "Source", accessor: (task) => task?.source ?? "" },
  { label: "Control", accessor: (task) => task?.control?.title ?? "—" },
  { label: "Check", accessor: (task) => task?.check?.name ?? "—" },
  { label: "Framework", accessor: (task) => task?.framework?.title ?? "—" },
];

export function TaskDetailPage() {
  const { taskId } = useParams();
  const { task, timeline, isLoading, refresh } = useTaskDetail(taskId);
  const { metrics } = useSlaMetrics();
  const { updateTask, attachEvidence, syncTask, isSubmitting } = useTaskMutations();

  const handleStatusChange = useCallback(
    async (nextStatus) => {
      if (!taskId) {
        return;
      }
      await updateTask(taskId, { status: nextStatus });
      toast.success("Status updated", { description: `Task moved to ${nextStatus}` });
      refresh();
    },
    [refresh, taskId, updateTask],
  );

  const handleAttachEvidence = useCallback(
    async (payload) => {
      if (!taskId) {
        return;
      }

      await attachEvidence(taskId, payload);
      toast.success("Evidence linked");
      refresh();
    },
    [attachEvidence, refresh, taskId],
  );

  const handleSync = useCallback(async () => {
    if (!taskId) {
      return;
    }

    await syncTask(taskId, {});
    toast.success("Sync queued");
  }, [syncTask, taskId]);

  if (isLoading && !task) {
    return <Skeleton className="h-[400px]" />;
  }

  if (!task) {
    return <p className="text-sm text-muted-foreground">Task not found.</p>;
  }

  const availableActions = STATUS_ACTIONS.filter((action) => action.from.includes(task.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tasks">
            <IconArrowLeft className="mr-2 size-4" /> Back to inbox
          </Link>
        </Button>
        <Badge variant="outline">{task.status}</Badge>
        <span className="text-sm text-muted-foreground">Task #{task.id.slice(0, 8)}</span>
      </div>
      <EscalationBanner task={task} metrics={metrics} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{task.description || "No description provided."}</p>
              <Separator />
              <dl className="grid gap-4 md:grid-cols-2">
                {FIELD_ROWS.map((field) => (
                  <div key={field.label}>
                    <dt className="text-xs text-muted-foreground">{field.label}</dt>
                    <dd className="text-sm font-medium">{field.accessor(task)}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-xs text-muted-foreground">Owner</dt>
                  <dd className="text-sm font-medium">{task.owner?.name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">SLA due</dt>
                  <dd className="text-sm font-medium">
                    {task.slaDueAt ? new Date(task.slaDueAt).toLocaleString() : "No target"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <Button key={action.status} variant="outline" size="sm" disabled={isSubmitting} onClick={() => handleStatusChange(action.status)}>
                {action.icon ?? null}
                {isSubmitting ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : null}
                {action.label}
              </Button>
            ))}
          </div>
          <TaskTimeline events={timeline} isLoading={isLoading} />
        </div>
        <div className="space-y-4">
          <EvidenceAttachmentList evidence={task.evidence ?? []} onAttach={handleAttachEvidence} isAttaching={isSubmitting} />
          <ExternalSyncStatus sync={task.externalSync} onSync={handleSync} isSyncing={isSubmitting} />
        </div>
      </div>
    </div>
  );
}
