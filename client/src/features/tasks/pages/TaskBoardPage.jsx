import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical } from "@tabler/icons-react";
import { toast } from "sonner";

import { useTaskInbox } from "@/features/tasks/hooks/use-task-inbox";
import { useTaskMutations } from "@/features/tasks/hooks/use-task-mutations";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

const BOARD_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "AWAITING_EVIDENCE",
  "PENDING_VERIFICATION",
  "RESOLVED",
];

const STATUS_LABELS = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  AWAITING_EVIDENCE: "Awaiting evidence",
  PENDING_VERIFICATION: "Pending verification",
  RESOLVED: "Resolved",
};

const STATUS_ACCENT = {
  OPEN: "border-primary",
  IN_PROGRESS: "border-blue-500",
  AWAITING_EVIDENCE: "border-amber-500",
  PENDING_VERIFICATION: "border-indigo-500",
  RESOLVED: "border-emerald-500",
};

const TaskCard = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={"rounded-md border bg-card p-3 text-sm shadow-sm transition hover:shadow-md " + (isDragging ? "opacity-50" : "")}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <IconGripVertical className="mt-0.5 size-4 text-muted-foreground" />
        <div>
          <p className="font-medium leading-tight">{task.title}</p>
          <p className="text-xs text-muted-foreground">
            {task.owner?.name ?? "Unassigned"} · {task.priority}
          </p>
        </div>
      </div>
      {task.slaDueAt ? (
        <p className="mt-1 text-xs">Due {new Date(task.slaDueAt).toLocaleDateString()}</p>
      ) : null}
    </div>
  );
};

const Column = ({ status, tasks }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { column: status } });
  return (
    <Card ref={setNodeRef} className={`flex h-full flex-col border-2 ${STATUS_ACCENT[status] ?? "border-muted"} ${isOver ? "bg-muted/30" : ""}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          {STATUS_LABELS[status]}
          <Badge variant="secondary">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {tasks.length === 0 ? <p className="text-xs text-muted-foreground">No tasks</p> : tasks.map((task) => <TaskCard key={task.id} task={task} />)}
      </CardContent>
    </Card>
  );
};

export function TaskBoardPage() {
  const { tasks, isLoading, refresh } = useTaskInbox({ limit: 100 });
  const { updateTask } = useTaskMutations();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const grouped = useMemo(() => {
    return BOARD_STATUSES.reduce((acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status);
      return acc;
    }, {});
  }, [tasks]);

  const handleDragEnd = async (event) => {
    if (!event.over) {
      return;
    }

    const nextStatus = event.over.id;
    const task = tasks.find((entry) => entry.id === event.active.id);
    if (!task || !nextStatus || task.status === nextStatus) {
      return;
    }

    try {
      await updateTask(task.id, { status: nextStatus });
      toast.success("Task updated", { description: `${task.title} moved to ${STATUS_LABELS[nextStatus]}` });
      refresh();
    } catch (error) {
      toast.error("Unable to update task", { description: error.message });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BOARD_STATUSES.map((status) => (
          <Skeleton key={status} className="h-[500px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Task board</h1>
        <p className="text-sm text-muted-foreground">Drag cards between columns to reflect the actual lifecycle state.</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {BOARD_STATUSES.map((status) => (
            <Column key={status} status={status} tasks={grouped[status] ?? []} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
