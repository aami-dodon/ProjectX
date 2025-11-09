import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EvidenceControlMatrix } from "@/components/governance/EvidenceControlMatrix";
import { GovernanceScorecard } from "@/features/governance/overview/components/GovernanceScorecard";
import { FrameworkTrendChart } from "@/features/governance/overview/components/FrameworkTrendChart";
import { ControlDrilldownPanel } from "@/features/governance/overview/components/ControlDrilldownPanel";
import { RemediationWorkflowPanel } from "@/features/governance/overview/components/RemediationWorkflowPanel";
import { useGovernanceOverview } from "@/features/governance/overview/hooks/useGovernanceOverview";
import copy from "@/features/governance/overview/locales/en.json";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";

export function GovernanceOverviewPage() {
  const {
    overview,
    summary,
    controls,
    trend,
    reviewQueue,
    runs,
    evidence,
    checks,
    isLoading,
    isMutating,
    refresh,
    triggerRuns,
    recalcScores,
    error,
  } = useGovernanceOverview();
  const [batchCheckIds, setBatchCheckIds] = useState("");
  const [scoreControlIds, setScoreControlIds] = useState("");
  const [granularity, setGranularity] = useState("DAILY");

  const derivedSummary = useMemo(
    () => ({
      ...summary,
      postureScore: summary?.postureScore ?? overview?.summary?.postureScore ?? null,
    }),
    [summary, overview?.summary?.postureScore]
  );

  const handleBatchRun = async () => {
    const checkIds = normalizeList(batchCheckIds);
    if (!checkIds.length) {
      toast.error("Provide at least one check ID.");
      return;
    }
    try {
      await triggerRuns({ checkIds });
      toast.success(`Scheduled ${checkIds.length} check${checkIds.length > 1 ? "s" : ""}`);
      setBatchCheckIds("");
    } catch (err) {
      toast.error(err?.message ?? "Unable to schedule runs");
    }
  };

  const handleRecalculate = async () => {
    const controlIds = normalizeList(scoreControlIds);
    if (!controlIds.length) {
      toast.error("Provide at least one control ID.");
      return;
    }
    try {
      await recalcScores({ controlIds, granularity });
      toast.success(`Recalculated ${controlIds.length} control${controlIds.length > 1 ? "s" : ""}`);
      setScoreControlIds("");
    } catch (err) {
      toast.error(err?.message ?? "Unable to recalculate control scores");
    }
  };

  if (isLoading && !overview) {
    return <OverviewSkeleton />;
  }

  if (error && !overview) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-semibold">Unable to load governance overview.</p>
        <p className="text-sm text-muted-foreground">{error.message ?? "Unknown error"}</p>
        <Button onClick={refresh}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OperationsPanel
        copy={copy}
        batchCheckIds={batchCheckIds}
        onBatchChange={setBatchCheckIds}
        onBatchRun={handleBatchRun}
        controlIds={scoreControlIds}
        onControlsChange={setScoreControlIds}
        onRecalculate={handleRecalculate}
        granularity={granularity}
        onGranularityChange={setGranularity}
        isMutating={isMutating}
      />
      <GovernanceScorecard summary={derivedSummary} checks={checks} onRefresh={refresh} isRefreshing={isLoading} />
      <div className="grid gap-6 lg:grid-cols-3">
        <FrameworkTrendChart trend={trend} summary={derivedSummary} />
        <RemediationWorkflowPanel reviewQueue={reviewQueue} runs={runs} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <ControlDrilldownPanel controls={controls?.spotlight ?? []} />
        <EvidenceControlMatrix links={evidence} />
      </div>
    </div>
  );
}

function OperationsPanel({
  copy,
  batchCheckIds,
  onBatchChange,
  onBatchRun,
  controlIds,
  onControlsChange,
  onRecalculate,
  granularity,
  onGranularityChange,
  isMutating,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.operationsTitle}</CardTitle>
        <CardDescription>{copy.operationsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="checkIds">{copy.batchRunLabel}</Label>
          <Textarea
            id="checkIds"
            placeholder={copy.batchRunPlaceholder}
            value={batchCheckIds}
            onChange={(event) => onBatchChange(event.target.value)}
          />
          <Button onClick={onBatchRun} disabled={isMutating}>
            {copy.batchRunCta}
          </Button>
        </div>
        <div className="space-y-3">
          <Label htmlFor="controlIds">{copy.recalculateLabel}</Label>
          <Input
            id="controlIds"
            placeholder={copy.recalculatePlaceholder}
            value={controlIds}
            onChange={(event) => onControlsChange(event.target.value)}
          />
          <div className="flex gap-3">
            <Select value={granularity} onValueChange={onGranularityChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Granularity" />
              </SelectTrigger>
              <SelectContent>
                {["DAILY", "WEEKLY", "MONTHLY"].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onRecalculate} disabled={isMutating}>
              {copy.recalculateCta}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function normalizeList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
