import { useState } from "react";
import { toast } from "sonner";

import { ReviewTaskDrawer } from "@/features/governance/checks/components/ReviewTaskDrawer";
import { useReviewQueue } from "@/features/governance/checks/hooks/useReviewQueue";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

export function ReviewQueuePage() {
  const { items, filters, setFilters, summary, isLoading, completeReview } = useReviewQueue();
  const [activeTask, setActiveTask] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const openDrawer = (task) => {
    setActiveTask(task);
  };

  const handleComplete = async (payload) => {
    if (!activeTask) return;
    setIsCompleting(true);
    try {
      await completeReview(activeTask.id, payload);
      toast.success("Review completed");
      setActiveTask(null);
    } catch (error) {
      toast.error(error?.message ?? "Unable to complete review");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Review Queue</CardTitle>
            <CardDescription>Manual and hybrid executions awaiting reviewer sign-off.</CardDescription>
          </div>
          <div className="flex gap-3">
            <Select
              value={filters.state ? filters.state : "__all"}
              onValueChange={(value) =>
                setFilters((previous) => ({ ...previous, state: value === "__all" ? "" : value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All states</SelectItem>
                {["OPEN", "IN_PROGRESS", "COMPLETED", "ESCALATED"].map((state) => (
                  <SelectItem key={state} value={state}>
                    {state.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.priority ? filters.priority : "__all"}
              onValueChange={(value) =>
                setFilters((previous) => ({ ...previous, priority: value === "__all" ? "" : value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All priorities</SelectItem>
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Due</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading review tasks…
                  </TableCell>
                </TableRow>
              ) : items.length ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.check?.name ?? item.checkId}</span>
                        <span className="text-xs text-muted-foreground">
                          Result {item.result?.status} — {item.result?.severity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{item.state}</Badge>
                    </TableCell>
                    <TableCell>{item.dueAt ? new Date(item.dueAt).toLocaleString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openDrawer(item)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No queued reviews.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {Object.entries(summary).map(([state, count]) => (
              <Badge key={state} variant="outline">
                {state}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <ReviewTaskDrawer
        task={activeTask}
        open={Boolean(activeTask)}
        onOpenChange={(open) => !open && setActiveTask(null)}
        onSubmit={handleComplete}
        isSubmitting={isCompleting}
      />
    </div>
  );
}
