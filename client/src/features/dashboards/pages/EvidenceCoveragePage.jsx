import { useEvidenceMetrics } from "@/features/dashboards/hooks/useEvidenceMetrics";
import { EvidenceFreshnessTable } from "@/features/dashboards/components/EvidenceFreshnessTable";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function EvidenceCoveragePage() {
  const { data, isLoading, error, refresh } = useEvidenceMetrics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Evidence coverage</h1>
          <p className="text-sm text-muted-foreground">Freshness buckets and upcoming expirations.</p>
        </div>
        <Button variant="outline" onClick={() => refresh().catch(() => null)}>
          Refresh
        </Button>
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">Unable to load evidence metrics.</p>
            <p className="text-sm text-muted-foreground">{error.message ?? "Unknown error"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle>Coverage</CardTitle>
              <CardDescription>Controls backed by fresh evidence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-semibold">{data?.coverage?.coveragePercent ?? 0}%</div>
              <p className="text-sm text-muted-foreground">
                {data?.coverage?.withEvidence ?? 0} of {data?.coverage?.totalControls ?? 0} controls maintain recent evidence.
              </p>
            </CardContent>
          </Card>
          <EvidenceFreshnessTable freshness={data?.freshness ?? []} expiring={data?.expiring ?? []} />
        </div>
      )}
    </div>
  );
}
