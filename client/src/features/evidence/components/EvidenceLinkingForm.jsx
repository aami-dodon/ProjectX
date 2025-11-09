import { useEffect, useMemo, useState } from "react";
import { IconLink, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { fetchControls } from "@/features/governance/controls/api/controlsClient";
import { fetchChecks } from "@/features/governance/checks/api/checksClient";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
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
  const [controlOptions, setControlOptions] = useState([]);
  const [checkOptions, setCheckOptions] = useState([]);
  const [isLoadingControls, setIsLoadingControls] = useState(false);
  const [isLoadingChecks, setIsLoadingChecks] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadControls = async () => {
      setIsLoadingControls(true);
      try {
        const response = await fetchControls({ limit: 100, status: "ACTIVE" });
        if (isMounted) {
          setControlOptions(response.data ?? []);
        }
      } catch (error) {
        console.error("Unable to load controls", error);
      } finally {
        if (isMounted) {
          setIsLoadingControls(false);
        }
      }
    };

    const loadChecks = async () => {
      setIsLoadingChecks(true);
      try {
        const response = await fetchChecks({ limit: 100, status: "ACTIVE" });
        if (isMounted) {
          setCheckOptions(response.data ?? []);
        }
      } catch (error) {
        console.error("Unable to load checks", error);
      } finally {
        if (isMounted) {
          setIsLoadingChecks(false);
        }
      }
    };

    loadControls();
    loadChecks();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedControlOptions = useMemo(() => {
    if (!formState.controlId || controlOptions.some((control) => control.id === formState.controlId)) {
      return controlOptions;
    }
    return [...controlOptions, { id: formState.controlId, title: "Linked control" }];
  }, [controlOptions, formState.controlId]);

  const normalizedCheckOptions = useMemo(() => {
    if (!formState.checkId || checkOptions.some((check) => check.id === formState.checkId)) {
      return checkOptions;
    }
    return [...checkOptions, { id: formState.checkId, name: "Linked check" }];
  }, [checkOptions, formState.checkId]);

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
            <Label htmlFor="link-control">Control</Label>
            <Select
              value={formState.controlId || "__none"}
              onValueChange={(value) =>
                setFormState((previous) => ({ ...previous, controlId: value === "__none" ? "" : value }))
              }
              disabled={isSubmitting || isLoadingControls}
            >
              <SelectTrigger id="link-control">
                <SelectValue placeholder={isLoadingControls ? "Loading controls…" : "Select a control"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No control</SelectItem>
                {normalizedControlOptions.map((control) => (
                  <SelectItem key={control.id} value={control.id}>
                    {control.title ?? control.slug ?? control.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 text-sm">
            <Label htmlFor="link-check">Check</Label>
            <Select
              value={formState.checkId || "__none"}
              onValueChange={(value) =>
                setFormState((previous) => ({ ...previous, checkId: value === "__none" ? "" : value }))
              }
              disabled={isSubmitting || isLoadingChecks}
            >
              <SelectTrigger id="link-check">
                <SelectValue placeholder={isLoadingChecks ? "Loading checks…" : "Select a check"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No check</SelectItem>
                {normalizedCheckOptions.map((check) => (
                  <SelectItem key={check.id} value={check.id}>
                    {check.name ?? check.slug ?? check.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
