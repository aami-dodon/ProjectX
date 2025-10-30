import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

const FALLBACK_TOTALS = {
  all: 0,
  active: 0,
  pending: 0,
  suspended: 0,
  invited: 0,
  verified: 0,
};

function StatCard({ label, value, description, isLoading }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="space-y-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {isLoading ? <Skeleton className="h-8 w-24" /> : value.toLocaleString()}
        </CardTitle>
      </CardHeader>
      {description ? (
        <CardContent>
          {isLoading ? <Skeleton className="h-4 w-32" /> : <p className="text-sm text-muted-foreground">{description}</p>}
        </CardContent>
      ) : null}
    </Card>
  );
}

export function UserStatsCards({ totals, isLoading = false }) {
  const stats = totals ?? FALLBACK_TOTALS;

  return (
    <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6 xl:grid-cols-6">
      <StatCard label="Total users" value={stats.all} isLoading={isLoading} />
      <StatCard label="Active" value={stats.active} isLoading={isLoading} />
      <StatCard
        label="Pending verification"
        value={stats.pending}
        isLoading={isLoading}
      />
      <StatCard label="Invited" value={stats.invited} isLoading={isLoading} />
      <StatCard label="Suspended" value={stats.suspended} isLoading={isLoading} />
      <StatCard
        label="Verified"
        value={stats.verified}
        isLoading={isLoading}
      />
    </div>
  );
}
