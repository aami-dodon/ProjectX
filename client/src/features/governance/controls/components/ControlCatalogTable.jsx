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

const STATUS_BADGES = {
  DRAFT: "secondary",
  ACTIVE: "default",
  DEPRECATED: "destructive",
};

const RISK_VARIANTS = {
  HIGH: "destructive",
  MEDIUM: "secondary",
  LOW: "outline",
};

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  risk: "",
  domain: "",
};

export function ControlCatalogTable({
  controls = [],
  selectedControlId,
  onSelect,
  isLoading = false,
  filters = DEFAULT_FILTERS,
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

    if (!controls.length) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center text-muted-foreground">
            No controls match the current filters.
          </TableCell>
        </TableRow>
      );
    }

    return controls.map((control) => (
      <TableRow
        key={control.id}
        onClick={() => onSelect?.(control)}
        className={cn("cursor-pointer", selectedControlId === control.id && "bg-muted/40")}
      >
        <TableCell className="font-medium">
          <div className="flex flex-col">
            <span>{control.title}</span>
            <span className="text-xs text-muted-foreground">{control.slug}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={STATUS_BADGES[control.status] ?? "secondary"}>{control.status}</Badge>
        </TableCell>
        <TableCell>
          <Badge variant={RISK_VARIANTS[control.riskTier] ?? "outline"}>{control.riskTier ?? "-"}</Badge>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div className="text-muted-foreground">Frameworks</div>
            <div>{control.stats?.frameworks ?? 0}</div>
          </div>
        </TableCell>
        <TableCell>
          {control.stats?.latestScore ? (
            <div className="flex flex-col text-sm">
              <span className="font-semibold">{(control.stats.latestScore.score * 100).toFixed(0)}%</span>
              <span className="text-muted-foreground text-xs">{control.stats.latestScore.classification}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">No scores</span>
          )}
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
            <CardTitle>Control Catalog</CardTitle>
            <CardDescription>Review taxonomy, risk tiers, and score health.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {summaryEntries.length ? (
              summaryEntries.map(([status, value]) => (
                <div key={status} className="flex items-center gap-1 rounded-full border px-3 py-1">
                  <Badge variant={STATUS_BADGES[status] ?? "outline"}>{status}</Badge>
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
              placeholder="Search by title or slug"
              className="border-0 px-0 focus-visible:ring-0"
            />
          </div>
          <FilterSelect
            label="Status"
            value={filters.status ?? ""}
            onChange={(value) => handleFilterChange("status", value)}
            options={['DRAFT', 'ACTIVE', 'DEPRECATED']}
          />
          <FilterSelect
            label="Risk"
            value={filters.risk ?? ""}
            onChange={(value) => handleFilterChange("risk", value)}
            options={['LOW', 'MEDIUM', 'HIGH']}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconFilter className="size-4" />
            <span>{controls.length} results</span>
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
              <TableHead>Control</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Frameworks</TableHead>
              <TableHead>Latest Score</TableHead>
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
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
