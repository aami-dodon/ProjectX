import { useMemo, useState } from "react";

import { ControlHeatmap } from "@/features/dashboards/components/ControlHeatmap";
import { useControlMetrics } from "@/features/dashboards/hooks/useControlMetrics";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function ControlHealthPage() {
  const { data, filters, setFilters, isLoading, error, refresh } = useControlMetrics({});
  const [domain, setDomain] = useState(filters.domain ?? "");
  const [owner, setOwner] = useState(filters.ownerTeam ?? "");

  const spotlight = useMemo(() => data?.spotlight ?? [], [data?.spotlight]);

  const handleApply = () => {
    const nextFilters = {
      ...filters,
      domain: domain.trim() || undefined,
      ownerTeam: owner.trim() || undefined,
    };
    setFilters(nextFilters);
    refresh(nextFilters).catch(() => null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Control health</h1>
        <p className="text-sm text-muted-foreground">Understand domains and controls that require attention.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Slice by domain or owner to focus remediation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="domain-filter">Domain</Label>
            <Input id="domain-filter" value={domain} onChange={(event) => setDomain(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-filter">Owner team</Label>
            <Input id="owner-filter" value={owner} onChange={(event) => setOwner(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleApply} disabled={isLoading}>
              Apply filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && !data ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">Unable to load control health data.</p>
            <p className="text-sm text-muted-foreground">{error.message ?? "Unknown error"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <ControlHeatmap matrix={data?.matrix ?? []} />
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Spotlight</CardTitle>
              <CardDescription>Controls requiring intervention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {spotlight.length === 0 ? (
                <p className="text-sm text-muted-foreground">All controls look good.</p>
              ) : (
                spotlight.slice(0, 6).map((control) => (
                  <div key={control.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{control.title}</p>
                        <p className="text-xs text-muted-foreground">{control.domain}</p>
                      </div>
                      <Badge variant={control.classification === "FAILING" ? "destructive" : "outline"}>
                        {control.score !== null ? `${Math.round(control.score * 100)}%` : "--"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <span>{control.tasks?.open ?? 0} open</span>
                      <span>{control.tasks?.overdue ?? 0} overdue</span>
                      <span>{control.tasks?.escalated ?? 0} escalated</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
