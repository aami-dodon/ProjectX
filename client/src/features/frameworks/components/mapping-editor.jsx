import { useState } from "react";
import { CoverageMatrixChart } from "@/components/governance/coverage-matrix-chart";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
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
import { Textarea } from "@/shared/components/ui/textarea";

const DEFAULT_FORM = {
  sourceControlId: "",
  targetControlId: "",
  mappingStrength: "EXACT",
  justification: "",
};

export function MappingEditor({
  mappings = [],
  summary,
  matrix,
  filters,
  setFilters,
  onCreateMapping,
  frameworks = [],
  isSubmitting,
}) {
  const [formState, setFormState] = useState(DEFAULT_FORM);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSelect = (field) => (value) => {
    if (field === "targetFrameworkId") {
      setFilters?.({ targetFrameworkId: value });
      return;
    }
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreateMapping?.({
      sourceControlId: formState.sourceControlId.trim(),
      targetControlId: formState.targetControlId.trim(),
      mappingStrength: formState.mappingStrength,
      justification: formState.justification?.trim() || undefined,
    });
    setFormState(DEFAULT_FORM);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Mappings</CardTitle>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1 text-sm">
              <Label>Target framework</Label>
              <Select
                value={filters.targetFrameworkId || "all"}
                onValueChange={(value) => handleSelect("targetFrameworkId")(value === "all" ? "" : value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All frameworks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All frameworks</SelectItem>
                  {frameworks.map((framework) => (
                    <SelectItem key={framework.id} value={framework.id}>
                      {framework.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 text-sm">
              <Label>Strength</Label>
              <Select
                value={filters.strength || "all"}
                onValueChange={(value) =>
                  setFilters?.({ strength: value === "all" ? "" : value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="EXACT">Exact</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="INFORMATIVE">Informative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source control</TableHead>
                <TableHead>Target control</TableHead>
                <TableHead>Target framework</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead>Justification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.length ? (
                mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      {mapping.sourceControl?.code ?? "N/A"}
                      <p className="text-xs text-muted-foreground">{mapping.sourceControl?.title}</p>
                    </TableCell>
                    <TableCell>
                      {mapping.targetControl?.code ?? "N/A"}
                      <p className="text-xs text-muted-foreground">{mapping.targetControl?.title}</p>
                    </TableCell>
                    <TableCell>{mapping.targetFramework?.title ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{mapping.strength}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{mapping.justification ?? "—"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No mappings recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Source control ID">
              <Input value={formState.sourceControlId} onChange={handleChange("sourceControlId")} required />
            </Field>
            <Field label="Target control ID">
              <Input value={formState.targetControlId} onChange={handleChange("targetControlId")} required />
            </Field>
            <Field label="Strength">
              <Select value={formState.mappingStrength} onValueChange={handleSelect("mappingStrength")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select strength" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXACT">Exact</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="INFORMATIVE">Informative</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Justification">
              <Textarea rows={3} value={formState.justification} onChange={handleChange("justification")} />
            </Field>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSubmitting}>
              Link controls
            </Button>
          </CardFooter>
        </Card>
        <CoverageMatrixChart matrix={matrix} summary={summary} />
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
