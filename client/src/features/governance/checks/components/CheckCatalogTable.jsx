import { IconFilter, IconSearch } from "@tabler/icons-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  type: "",
  severity: "",
};

const STATUS_BADGE_VARIANTS = {
  DRAFT: "secondary",
  READY_FOR_VALIDATION: "outline",
  ACTIVE: "default",
  RETIRED: "destructive",
};

const typeLabels = {
  AUTOMATED: "Automated",
  MANUAL: "Manual",
  HYBRID: "Hybrid",
};

export function CheckCatalogTable({
  checks = [],
  selectedCheckId,
  onSelect,
  isLoading = false,
  filters,
  onFilterChange,
  summary = {},
}) {
  const handleFilterChange = (key, value) => {
    if (typeof onFilterChange === "function") {
      onFilterChange({
        ...filters,
        [key]: value,
      });
    }
  };

  const renderRows = () => {
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell colSpan={5}>
            <Skeleton className="h-10 w-full" />
          </TableCell>
        </TableRow>
      ));
    }

    if (!checks.length) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center text-muted-foreground">
            No checks match the current filters.
          </TableCell>
        </TableRow>
      );
    }

    return checks.map((check) => (
      <TableRow
        key={check.id}
        onClick={() => onSelect?.(check)}
        className={cn("cursor-pointer", selectedCheckId === check.id && "bg-muted/40")}
      >
        <TableCell className="font-medium">
          <div className="flex flex-col">
            <span>{check.name}</span>
            {check.description ? (
              <span className="text-xs text-muted-foreground line-clamp-1">{check.description}</span>
            ) : null}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{typeLabels[check.type] ?? check.type}</Badge>
        </TableCell>
        <TableCell>
          <Badge variant={STATUS_BADGE_VARIANTS[check.status] ?? "secondary"}>{check.status}</Badge>
        </TableCell>
        <TableCell className="capitalize">{check.severityDefault?.toLowerCase()}</TableCell>
        <TableCell>
          <div className="text-sm">
            <div className="text-muted-foreground">Next run</div>
            <div>{check.nextRunAt ? new Date(check.nextRunAt).toLocaleString() : "Not scheduled"}</div>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const summaryEntries = Object.entries(summary?.status ?? {}).filter(([, value]) => value > 0);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Check Catalog</CardTitle>
            <CardDescription>Filter definitions by lifecycle, type, or severity.</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {summaryEntries.length ? (
              summaryEntries.map(([status, value]) => (
                <div key={status} className="flex items-center gap-1 rounded-full border px-3 py-1">
                  <Badge variant={STATUS_BADGE_VARIANTS[status] ?? "outline"}>{status}</Badge>
                  <span>{value}</span>
                </div>
              ))
            ) : (
              <span>No lifecycle metrics</span>
            )}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="col-span-2 flex items-center rounded-md border px-3">
            <IconSearch className="mr-2 size-4 text-muted-foreground" />
            <Input
              value={filters.search ?? ""}
              onChange={(event) => handleFilterChange("search", event.target.value)}
              placeholder="Search by name or description"
              className="border-0 px-0 focus-visible:ring-0"
            />
          </div>
          <FilterSelect
            label="Status"
            value={filters.status ?? ""}
            onChange={(value) => handleFilterChange("status", value)}
            options={["", "DRAFT", "READY_FOR_VALIDATION", "ACTIVE", "RETIRED"]}
          />
          <FilterSelect
            label="Type"
            value={filters.type ?? ""}
            onChange={(value) => handleFilterChange("type", value)}
            options={["", "AUTOMATED", "MANUAL", "HYBRID"]}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconFilter className="size-4" />
            <span>{checks.length} results</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onFilterChange?.(DEFAULT_FILTERS)}>
            Reset filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Definition</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Cadence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderRows()}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  const ALL_VALUE = "__all";
  const normalizedValue = value ? value : ALL_VALUE;
  const selectableOptions = Array.isArray(options) ? options.filter(Boolean) : [];

  const handleChange = (nextValue) => {
    if (typeof onChange === "function") {
      onChange(nextValue === ALL_VALUE ? "" : nextValue);
    }
  };

  return (
    <Select value={normalizedValue} onValueChange={handleChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{`All ${label}`}</SelectItem>
        {selectableOptions.map((option) => (
          <SelectItem key={option} value={option}>
            {option.replaceAll("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
