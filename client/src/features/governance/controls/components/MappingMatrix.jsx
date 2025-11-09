import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

const COVERAGE = ["FULL", "PARTIAL", "COMPENSATING"];
const STATUSES = ["ACTIVE", "IN_REVIEW", "RETIRED"];

export function MappingMatrix({ mappings = [], onSave, isSaving = false }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setRows(mappings.map((mapping) => ({ ...mapping })));
  }, [mappings]);

  const updateRow = (index, field, value) => {
    setRows((previous) =>
      previous.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows((previous) => [
      ...previous,
      {
        frameworkId: "",
        frameworkControlId: "",
        coverageLevel: "PARTIAL",
        status: "ACTIVE",
      },
    ]);
  };

  const removeRow = (index) => {
    setRows((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSave = async () => {
    if (typeof onSave === "function") {
      await onSave(rows);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Framework Mapping Matrix</CardTitle>
          <CardDescription>Align this control to framework requirements and coverage tiers.</CardDescription>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addRow}>
          <Plus className="mr-1 size-4" /> Add row
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length ? (
          rows.map((row, index) => (
            <div key={`mapping-${index}`} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Mapping #{index + 1}</Label>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={row.frameworkId ?? ""}
                  onChange={(event) => updateRow(index, "frameworkId", event.target.value)}
                  placeholder="Framework ID"
                />
                <Input
                  value={row.frameworkControlId ?? ""}
                  onChange={(event) => updateRow(index, "frameworkControlId", event.target.value)}
                  placeholder="Requirement / control ID"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Select
                  value={row.coverageLevel ?? "PARTIAL"}
                  onValueChange={(value) => updateRow(index, "coverageLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Coverage" />
                  </SelectTrigger>
                  <SelectContent>
                    {COVERAGE.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={row.status ?? "ACTIVE"}
                  onValueChange={(value) => updateRow(index, "status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={row.notes ?? ""}
                onChange={(event) => updateRow(index, "notes", event.target.value)}
                placeholder="Reviewer notes"
              />
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Add at least one mapping to activate this control.</p>
        )}
        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={isSaving || rows.length === 0}>
            Save matrix
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
