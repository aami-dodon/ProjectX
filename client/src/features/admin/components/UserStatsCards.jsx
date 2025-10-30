import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

const STAT_CONFIG = [
  { key: "all", label: "Total users", description: "All accounts in the system" },
  { key: "active", label: "Active", description: "Signed in within the last 30 days" },
  { key: "pending", label: "Pending verification", description: "Awaiting onboarding steps" },
  { key: "invited", label: "Invited", description: "Invitations sent but not accepted" },
  { key: "suspended", label: "Suspended", description: "Temporarily disabled accounts" },
  { key: "verified", label: "Verified", description: "Email and profile confirmed" },
];

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
    <Card className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-background/95 via-background to-muted/30 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70" aria-hidden />
      <CardHeader className="space-y-2 pb-4">
        <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
          {label}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          {isLoading ? <Skeleton className="h-8 w-24" /> : Number(value ?? 0).toLocaleString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function UserStatsCards({ totals, isLoading = false }) {
  const stats = totals ?? FALLBACK_TOTALS;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {STAT_CONFIG.map(({ key, label, description }) => (
        <StatCard
          key={key}
          label={label}
          value={stats[key]}
          description={description}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
