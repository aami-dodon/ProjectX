import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const DEFAULT_SUMMARY = {
  status: {},
  priority: {},
  escalation: {},
};

export function TaskControlPanel({ summary = DEFAULT_SUMMARY }) {
  const stats = [
    { label: "Open", value: summary?.status?.OPEN ?? 0 },
    { label: "In progress", value: summary?.status?.IN_PROGRESS ?? 0 },
    { label: "Awaiting evidence", value: summary?.status?.AWAITING_EVIDENCE ?? 0 },
    { label: "Pending verification", value: summary?.status?.PENDING_VERIFICATION ?? 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SLA overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
