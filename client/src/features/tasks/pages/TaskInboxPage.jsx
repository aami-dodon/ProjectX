import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { IconArrowRight, IconFilter, IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";

import { EscalationBanner } from "@/features/tasks/components/escalation-banner";
import { TaskForm } from "@/features/tasks/components/task-form";
import { useTaskInbox } from "@/features/tasks/hooks/use-task-inbox";
import { useTaskMutations } from "@/features/tasks/hooks/use-task-mutations";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { TaskControlPanel } from "@/features/governance/components/TaskControlPanel";

const STATUS_FILTERS = [
  { value: "ALL", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "AWAITING_EVIDENCE", label: "Awaiting evidence" },
  { value: "PENDING_VERIFICATION", label: "Pending verification" },
  { value: "RESOLVED", label: "Resolved" },
];

const PRIORITY_FILTERS = [
  { value: "ALL", label: "All priorities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const STATUS_BADGES = {
  OPEN: "default",
  IN_PROGRESS: "default",
  AWAITING_EVIDENCE: "secondary",
  PENDING_VERIFICATION: "outline",
  RESOLVED: "outline",
  CLOSED: "secondary",
};

export function TaskInboxPage() {
  const { tasks, summary, filters, setFilters, isLoading, refresh, derived } = useTaskInbox();
  const { createTask, isSubmitting } = useTaskMutations();

  const handleCreateTask = useCallback(
    async (payload) => {
      await createTask(payload);
      toast.success("Task created", { description: payload.title });
      refresh();
    },
    [createTask, refresh],
  );

  const metrics = useMemo(
    () => ({
      overdue: summary?.sla?.overdue ?? 0,
      atRisk: summary?.sla?.atRisk ?? 0,
      activeTotal: summary?.status?.OPEN ?? 0,
      byEscalationLevel: summary?.escalation ?? {},
    }),
    [summary],
  );
  const focusTask = tasks[0] ?? { slaState: "healthy", escalationLevel: 0, slaDueAt: null };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Task inbox</h1>
        <p className="text-sm text-muted-foreground">Track and prioritize remediation tasks across the governance program.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Remediation queue</CardTitle>
                <CardDescription>{derived.total} tasks</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={refresh}>
                <IconRefresh className="mr-2 size-4" /> Refresh
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="task-search" className="text-xs text-muted-foreground">
                  Search
                </Label>
                <div className="flex items-center rounded-md border px-3">
                  <IconFilter className="mr-2 size-4 text-muted-foreground" />
                  <Input
                    id="task-search"
                    placeholder="Title or description"
                    value={filters.search ?? ""}
                    onChange={(event) => setFilters({ ...filters, search: event.target.value, offset: 0 })}
                    className="border-0 px-0 focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={filters.status ?? "ALL"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      status: value === "ALL" ? undefined : value,
                      offset: 0,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select
                  value={filters.priority ?? "ALL"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      priority: value === "ALL" ? undefined : value,
                      offset: 0,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead className="text-right">Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Skeleton key={`task-row-skeleton-${index}`} className="h-10 w-full" />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No tasks match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link to={`/tasks/${task.id}`} className="flex items-center gap-2 text-primary">
                          {task.title}
                          <IconArrowRight className="size-4" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGES[task.status] ?? "secondary"}>{task.status}</Badge>
                      </TableCell>
                      <TableCell>{task.priority}</TableCell>
                      <TableCell>
                        {task.slaDueAt ? new Date(task.slaDueAt).toLocaleString() : "No SLA"}
                        <div className="text-xs text-muted-foreground">State: {task.slaState ?? "healthy"}</div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {task.owner?.name ?? "Unassigned"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <EscalationBanner task={focusTask} metrics={metrics} />
          <TaskControlPanel summary={summary} />
          <TaskForm onSubmit={handleCreateTask} isSubmitting={isSubmitting} />
        </div>
      </div>
    </div>
  );
}
