import { useState } from "react";
import { IconLink, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const INITIAL_FORM = {
  controlId: "",
  checkId: "",
  taskReference: "",
  justification: "",
};

export function EvidenceLinkingForm({ links = [], onAdd, onRemove, isSubmitting = false }) {
  const [formState, setFormState] = useState(INITIAL_FORM);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.controlId && !formState.checkId && !formState.taskReference) {
      toast.error("Provide at least one control, check, or task reference");
      return;
    }

    try {
      await onAdd?.({
        links: [
          {
            controlId: formState.controlId || undefined,
            checkId: formState.checkId || undefined,
            taskReference: formState.taskReference || undefined,
            justification: formState.justification || undefined,
          },
        ],
      });
      setFormState(INITIAL_FORM);
    } catch (error) {
      toast.error(error?.message ?? "Unable to link evidence");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <IconLink className="h-5 w-5 text-muted-foreground" />
        <div>
          <CardTitle>Links</CardTitle>
          <p className="text-xs text-muted-foreground">Associate controls, checks, or tasks with this artifact.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1 text-sm">
            <Label htmlFor="link-control">Control ID</Label>
            <Input
              id="link-control"
              name="controlId"
              value={formState.controlId}
              onChange={handleChange}
              placeholder="control-uuid"
            />
          </div>
          <div className="space-y-1 text-sm">
            <Label htmlFor="link-check">Check ID</Label>
            <Input
              id="link-check"
              name="checkId"
              value={formState.checkId}
              onChange={handleChange}
              placeholder="check-uuid"
            />
          </div>
          <div className="space-y-1 text-sm">
            <Label htmlFor="link-task">Task reference</Label>
            <Input
              id="link-task"
              name="taskReference"
              value={formState.taskReference}
              onChange={handleChange}
              placeholder="task-123"
            />
          </div>
          <div className="space-y-1 text-sm">
            <Label htmlFor="link-justification">Justification</Label>
            <Input
              id="link-justification"
              name="justification"
              value={formState.justification}
              onChange={handleChange}
              placeholder="Optional context"
            />
          </div>
          <Button type="submit" className="md:col-span-4" disabled={isSubmitting}>
            {isSubmitting ? "Saving" : "Add link"}
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Control</TableHead>
              <TableHead>Check</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Justification</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length ? (
              links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="text-sm">
                    {link.controlTitle ? (
                      <span className="font-medium">{link.controlTitle}</span>
                    ) : (
                      link.controlId ?? "—"
                    )}
                  </TableCell>
                  <TableCell>{link.checkName ?? link.checkId ?? "—"}</TableCell>
                  <TableCell>{link.taskReference ?? "—"}</TableCell>
                  <TableCell>{link.justification ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemove?.(link)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No links yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
