import { useCallback } from "react";
import { Link } from "react-router-dom";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

import { ControlDrilldownPanel } from "@/features/governance/overview/components/ControlDrilldownPanel";
import { FrameworkTrendChart } from "@/features/governance/overview/components/FrameworkTrendChart";
import { useGovernanceOverview } from "@/features/governance/overview/hooks/useGovernanceOverview";
import { EvidenceLinksCard } from "@/features/home/components/EvidenceLinksCard";
import { HomeSummaryCards } from "@/features/home/components/HomeSummaryCards";
import { RecentRunsCard } from "@/features/home/components/RecentRunsCard";
import { ReviewQueueCard } from "@/features/home/components/ReviewQueueCard";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function HomePage() {
  const {
    overview,
    summary,
    trend,
    controls,
    reviewQueue,
    runs,
    evidence,
    frameworks,
    isLoading,
    error,
    refresh,
  } = useGovernanceOverview();

  const showSkeleton = isLoading && !overview;
  const hasData = Boolean(overview);

  const handleRefresh = useCallback(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return (
    <div className="space-y-6 py-4 md:py-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitor governance posture, queued reviews, and evidence activity from one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <IconRefresh className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link to="/governance">Open governance workspace</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorBanner
          message={error?.message ?? "Try refreshing or confirm you have governance access."}
          onRetry={handleRefresh}
        />
      ) : null}

      {showSkeleton ? (
        <HomePageSkeleton />
      ) : hasData ? (
        <>
          <HomeSummaryCards summary={summary} frameworks={frameworks} reviewQueue={reviewQueue} />
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <FrameworkTrendChart trend={trend} summary={summary} />
            </div>
            <ReviewQueueCard reviewQueue={reviewQueue} />
          </div>
          <div className="grid gap-6 2xl:grid-cols-3">
            <div className="2xl:col-span-2">
              <ControlDrilldownPanel controls={controls?.spotlight ?? []} />
            </div>
            <RecentRunsCard runs={runs} />
          </div>
          <EvidenceLinksCard links={evidence} />
        </>
      ) : (
        <EmptyState onRetry={handleRefresh} />
      )}
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
      <div className="flex items-center gap-2 font-medium">
        <IconAlertTriangle className="h-4 w-4" />
        Unable to load live posture data
      </div>
      <p className="mt-1 text-xs text-destructive/80">{message}</p>
      <Button variant="link" size="sm" className="px-0 text-destructive" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

function HomePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-96 w-full xl:col-span-2" />
        <Skeleton className="h-96 w-full" />
      </div>
      <div className="grid gap-6 2xl:grid-cols-3">
        <Skeleton className="h-96 w-full 2xl:col-span-2" />
        <Skeleton className="h-96 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

function EmptyState({ onRetry }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-10 text-center">
      <p className="text-lg font-semibold">Live posture data is unavailable.</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Refresh the page or confirm your account has the governance overview permission.
      </p>
      <div className="mt-4 flex justify-center">
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}
