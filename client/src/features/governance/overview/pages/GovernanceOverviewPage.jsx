import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EvidenceControlMatrix } from "@/components/governance/EvidenceControlMatrix";
import { GovernanceScorecard } from "@/features/governance/overview/components/GovernanceScorecard";
import { FrameworkTrendChart } from "@/features/governance/overview/components/FrameworkTrendChart";
import { ControlDrilldownPanel } from "@/features/governance/overview/components/ControlDrilldownPanel";
import { RemediationWorkflowPanel } from "@/features/governance/overview/components/RemediationWorkflowPanel";
import { useGovernanceOverview } from "@/features/governance/overview/hooks/useGovernanceOverview";
import { fetchChecks } from "@/features/governance/checks/api/checksClient";
import { fetchControls } from "@/features/governance/controls/api/controlsClient";
import copy from "@/features/governance/overview/locales/en.json";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { MultiSelect } from "@/shared/components/ui/multi-select";

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
  const [batchCheckIds, setBatchCheckIds] = useState([]);
  const [scoreControlIds, setScoreControlIds] = useState([]);
  const [checkOptions, setCheckOptions] = useState([]);
  const [controlOptions, setControlOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState({ checks: false, controls: false });
  const [granularity, setGranularity] = useState("DAILY");

  const derivedSummary = useMemo(
    () => ({
      ...summary,
      postureScore: summary?.postureScore ?? overview?.summary?.postureScore ?? null,
    }),
    [summary, overview?.summary?.postureScore]
  );

  const handleBatchRun = async () => {
    const checkIds = ensureArray(batchCheckIds);
    if (!checkIds.length) {
      toast.error("Provide at least one check ID.");
      return;
    }
    try {
      await triggerRuns({ checkIds });
      toast.success(`Scheduled ${checkIds.length} check${checkIds.length > 1 ? "s" : ""}`);
      setBatchCheckIds([]);
    } catch (err) {
      toast.error(err?.message ?? "Unable to schedule runs");
    }
  };

  const handleRecalculate = async () => {
    const controlIds = ensureArray(scoreControlIds);
    if (!controlIds.length) {
      toast.error("Provide at least one control ID.");
      return;
    }
    try {
      await recalcScores({ controlIds, granularity });
      toast.success(`Recalculated ${controlIds.length} control${controlIds.length > 1 ? "s" : ""}`);
      setScoreControlIds([]);
    } catch (err) {
      toast.error(err?.message ?? "Unable to recalculate control scores");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadChecks = async () => {
      setOptionsLoading((previous) => ({ ...previous, checks: true }));
      try {
        const response = await fetchChecks({ limit: 100, status: "ACTIVE" });
        if (isMounted) {
          setCheckOptions(response.data ?? []);
        }
      } catch (error) {
        console.error("Unable to load check options", error);
      } finally {
        if (isMounted) {
          setOptionsLoading((previous) => ({ ...previous, checks: false }));
        }
      }
    };

    const loadControls = async () => {
      setOptionsLoading((previous) => ({ ...previous, controls: true }));
      try {
        const response = await fetchControls({ limit: 100, status: "ACTIVE" });
        if (isMounted) {
          setControlOptions(response.data ?? []);
        }
      } catch (error) {
        console.error("Unable to load control options", error);
      } finally {
        if (isMounted) {
          setOptionsLoading((previous) => ({ ...previous, controls: false }));
        }
      }
    };

    loadChecks();
    loadControls();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedBatchCheckIds = ensureArray(batchCheckIds);
  const normalizedScoreControlIds = ensureArray(scoreControlIds);

  const checkOptionsWithSelection = useMemo(
    () => mergeSelectedOptions(normalizedBatchCheckIds, checkOptions, (id) => ({ id, name: "Linked check" })),
    [checkOptions, normalizedBatchCheckIds]
  );

  const controlOptionsWithSelection = useMemo(
    () => mergeSelectedOptions(normalizedScoreControlIds, controlOptions, (id) => ({ id, title: "Linked control" })),
    [controlOptions, normalizedScoreControlIds]
  );

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
        batchCheckIds={normalizedBatchCheckIds}
        onBatchChange={setBatchCheckIds}
        onBatchRun={handleBatchRun}
        controlIds={normalizedScoreControlIds}
        onControlsChange={setScoreControlIds}
        onRecalculate={handleRecalculate}
        granularity={granularity}
        onGranularityChange={setGranularity}
        isMutating={isMutating}
        checkOptions={checkOptionsWithSelection}
        controlOptions={controlOptionsWithSelection}
        checksLoading={optionsLoading.checks}
        controlsLoading={optionsLoading.controls}
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
  checkOptions,
  controlOptions,
  checksLoading,
  controlsLoading,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.operationsTitle}</CardTitle>
        <CardDescription>{copy.operationsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <MultiSelect
            label={copy.batchRunLabel}
            placeholder={checksLoading ? "Loading checks…" : "Select checks"}
            value={batchCheckIds}
            options={checkOptions}
            onChange={onBatchChange}
            isLoading={checksLoading}
            getOptionValue={(option) => option.id}
            getOptionLabel={(option) => option.name ?? option.slug ?? option.id}
            getOptionDescription={(option) => option.type ? `${option.type} • ${option.status}` : option.slug ?? option.id}
            description={copy.batchRunDescription}
          />
          <Button onClick={onBatchRun} disabled={isMutating}>
            {copy.batchRunCta}
          </Button>
        </div>
        <div className="space-y-3">
          <MultiSelect
            label={copy.recalculateLabel}
            placeholder={controlsLoading ? "Loading controls…" : "Select controls"}
            value={controlIds}
            options={controlOptions}
            onChange={onControlsChange}
            isLoading={controlsLoading}
            getOptionValue={(option) => option.id}
            getOptionLabel={(option) => option.title ?? option.slug ?? option.id}
            getOptionDescription={(option) => option.slug ?? option.id}
            description={copy.recalculateDescription}
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

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === "string") {
    return normalizeList(value);
  }
  return [];
}

function mergeSelectedOptions(currentValues = [], options = [], placeholderFactory) {
  if (!Array.isArray(currentValues) || !currentValues.length) {
    return options;
  }
  const missing = currentValues.filter(
    (selected) => !options.some((option) => (option.id ?? option.value) === selected)
  );
  if (!missing.length) {
    return options;
  }
  const placeholders = missing.map((id) => {
    const fallback = placeholderFactory?.(id);
    return fallback ?? { id, title: id };
  });
  return [...options, ...placeholders];
}
