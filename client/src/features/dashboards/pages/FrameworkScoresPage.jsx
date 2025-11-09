import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ExportSchedulerModal } from "@/features/reports/ExportSchedulerModal";
import { ScoreGauge } from "@/features/dashboards/components/ScoreGauge";
import { useFrameworkScores } from "@/features/dashboards/hooks/useFrameworkScores";
import { useReportExport } from "@/features/dashboards/hooks/useReportExport";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";

const GRANULARITY_OPTIONS = ["DAILY", "WEEKLY", "MONTHLY"];

export function FrameworkScoresPage() {
  const {
    data,
    summary,
    items,
    filters,
    setFilters,
    isLoading,
    error,
    refresh,
  } = useFrameworkScores({ granularity: "DAILY", windowDays: 30 });
  const [domainFilter, setDomainFilter] = useState(filters.domain ?? "");
  const [isModalOpen, setModalOpen] = useState(false);
  const { schedule, isSubmitting } = useReportExport();

  const burnDown = useMemo(
    () =>
      items.map((item) => ({
        title: item.framework?.title ?? "Unknown",
        slug: item.framework?.slug ?? "",
        avgScore: item.avgScore,
        failing: item.controls?.failing ?? 0,
        atRisk: item.controls?.atRisk ?? 0,
        withEvidence: item.controls?.withEvidence ?? 0,
        domains: item.domains ?? [],
      })),
    [items]
  );

  const handleFilterUpdate = () => {
    setFilters((previous) => ({
      ...previous,
      domain: domainFilter.trim() || undefined,
    }));
    refresh({ ...filters, domain: domainFilter.trim() || undefined }).catch(() => null);
  };

  const handleSchedule = async (payload) => {
    try {
      await schedule(payload);
      toast.success("Export scheduled");
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.message ?? "Unable to schedule export");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Framework posture</h1>
          <p className="text-sm text-muted-foreground">
            Track control health across frameworks and export attestation packs on demand.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => refresh().catch(() => null)} variant="outline">
            Refresh
          </Button>
          <Button onClick={() => setModalOpen(true)}>Schedule export</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Apply lightweight filters across dashboards.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              placeholder="e.g. Security"
              value={domainFilter}
              onChange={(event) => setDomainFilter(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Granularity</Label>
            <Select value={filters.granularity} onValueChange={(value) => setFilters((prev) => ({ ...prev, granularity: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {GRANULARITY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleFilterUpdate} disabled={isLoading}>
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
            <p className="font-medium">Unable to load framework data.</p>
            <p className="text-sm text-muted-foreground">{error.message ?? "Unknown error"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <ScoreGauge label="Average posture" score={summary?.avgScore ?? null} trend={items?.[0]?.trend} />
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Framework overview</CardTitle>
              <CardDescription>{summary?.totalFrameworks ?? 0} frameworks monitored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {burnDown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No frameworks found.</p>
              ) : (
                burnDown.map((framework) => (
                  <div key={framework.slug} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{framework.title}</p>
                        <p className="text-xs text-muted-foreground">{framework.slug}</p>
                      </div>
                      <Badge variant={framework.avgScore >= 0.85 ? "outline" : "destructive"}>
                        {framework.avgScore !== null ? `${Math.round(framework.avgScore * 100)}%` : "--"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                      <span>{framework.failing} failing</span>
                      <span>{framework.atRisk} at risk</span>
                      <span>{framework.withEvidence} with evidence</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {framework.domains.slice(0, 3).map((domain) => (
                        <Badge key={`${framework.slug}-${domain.domain}`} variant="secondary">
                          {domain.domain}: {domain.avgScore !== null ? `${Math.round(domain.avgScore * 100)}%` : "--"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ExportSchedulerModal
        open={isModalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSchedule}
        isSubmitting={isSubmitting}
        defaultFilters={filters}
      />
    </div>
  );
}
