import { IconClockHour4, IconUserCircle } from "@tabler/icons-react";

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

const EVENT_LABELS = {
  TASK_CREATED: "Task created",
  TASK_UPDATED: "Task updated",
  TASK_STATUS_CHANGED: "Status changed",
  TASK_ASSIGNED: "Assignment updated",
  TASK_ESCALATED: "Escalated",
  TASK_EVIDENCE_LINKED: "Evidence linked",
  TASK_ASSIGNMENT_REVOKED: "Assignment revoked",
  TASK_SYNC_REQUESTED: "External sync",
};

export function TaskTimeline({ events = [], isLoading = false, className }) {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`timeline-skeleton-${index}`} className="h-14 w-full" />
          ))}
        </div>
      );
    }

    if (!events.length) {
      return <p className="text-sm text-muted-foreground">No activity has been recorded for this task.</p>;
    }

    return (
      <div className="space-y-4">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          const actorLabel = event.actor?.name ?? event.actor?.email ?? event.actor?.id ?? "System";
          return (
            <div key={event.id} className="relative pl-6">
              {!isLast ? <span className="absolute left-[10px] top-6 h-full w-px bg-border" aria-hidden /> : null}
              <span className="absolute left-0 top-2 flex size-5 items-center justify-center rounded-full border bg-background text-xs font-semibold">
                {actorLabel[0]?.toUpperCase() ?? "?"}
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-sm font-medium">
                  <span>{EVENT_LABELS[event.type] ?? event.type}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <IconClockHour4 className="size-3" />
                    {event.createdAt ? new Date(event.createdAt).toLocaleString() : "Unknown"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <IconUserCircle className="size-3" />
                  <span>{actorLabel}</span>
                </div>
                {event.payload?.to || event.payload?.from ? (
                  <div className="text-xs">
                    {event.payload?.from ? (
                      <Badge variant="outline" className="mr-2">
                        From: {event.payload.from}
                      </Badge>
                    ) : null}
                    {event.payload?.to ? <Badge variant="secondary">To: {event.payload.to}</Badge> : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Separator className="my-4" />
        {renderContent()}
      </CardContent>
    </Card>
  );
}
