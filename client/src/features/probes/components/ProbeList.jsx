import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

const STATUS_LABELS = {
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  deprecated: { label: "Deprecated", variant: "outline" },
  unknown: { label: "Unknown", variant: "outline" },
};

export function ProbeList({ probes, selectedProbeId, onSelect, isLoading, filters, onFilterChange }) {
  const [search, setSearch] = useState(filters?.search ?? "");

  const statusCounters = useMemo(() => {
    return probes.reduce(
      (acc, probe) => {
        const status = probe.status ?? "unknown";
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      },
      { draft: 0, active: 0, deprecated: 0, unknown: 0 }
    );
  }, [probes]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    onFilterChange?.({ ...filters, search: search.trim() || undefined });
  };

  const handleStatusFilter = (status) => {
    onFilterChange?.({ ...filters, status: status === filters?.status ? undefined : status });
  };

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <CardTitle className="flex items-center justify-between">
          <span>Probes</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{probes.length} listed</span>
            <span className="h-1 w-1 rounded-full bg-muted" />
            <span>{statusCounters.active} active</span>
          </div>
        </CardTitle>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, owner, framework"
            className="pl-8"
          />
        </form>
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_LABELS).map(([key, value]) => (
            <Button
              key={key}
              type="button"
              variant={filters?.status === key ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusFilter(key)}
            >
              {value.label}
              <span className="ml-2 text-xs text-muted-foreground">{statusCounters[key]}</span>
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 overflow-auto">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={String(index)} className="h-16 w-full" />
            ))}
          </div>
        )}
        {!isLoading && probes.length === 0 && (
          <p className="text-sm text-muted-foreground">No probes match the current filters.</p>
        )}
        {!isLoading &&
          probes.map((probe) => {
            const statusMeta = STATUS_LABELS[probe.status] ?? STATUS_LABELS.unknown;
            const isSelected = probe.id === selectedProbeId;
            return (
              <button
                key={probe.id}
                type="button"
                onClick={() => onSelect?.(probe)}
                className={cn(
                  "w-full rounded-md border p-3 text-left transition hover:border-primary",
                  isSelected && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{probe.name}</p>
                    <p className="text-xs text-muted-foreground">{probe.ownerEmail}</p>
                  </div>
                  <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {(probe.frameworkBindings ?? []).map((framework) => (
                    <span key={framework} className="rounded bg-muted px-2 py-0.5">
                      {framework}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
      </CardContent>
    </Card>
  );
}
