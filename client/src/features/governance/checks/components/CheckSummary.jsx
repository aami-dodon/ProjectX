import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";

const statusVariant = {
  DRAFT: "secondary",
  READY_FOR_VALIDATION: "outline",
  ACTIVE: "default",
  RETIRED: "destructive",
};

export function CheckSummary({ check }) {
  if (!check) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Definition Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Select a check to view metadata.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">{check.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{check.description}</p>
        </div>
        <Badge variant={statusVariant[check.status] ?? "outline"}>{check.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 md:grid-cols-2">
          <Metadata label="Type" value={check.type} />
          <Metadata label="Default Severity" value={check.severityDefault} />
          <Metadata label="Cadence" value={check.frequency || "Not scheduled"} />
          <Metadata
            label="Last Run"
            value={check.lastRunAt ? new Date(check.lastRunAt).toLocaleString() : "Never"}
          />
          <Metadata
            label="Next Run"
            value={check.nextRunAt ? new Date(check.nextRunAt).toLocaleString() : "Not scheduled"}
          />
          <Metadata label="Tags" value={check.tags?.length ? check.tags.join(", ") : "—"} />
        </div>
        <Separator />
        <div>
          <p className="text-xs font-medium text-muted-foreground">Control Coverage</p>
          <ul className="mt-2 space-y-1">
            {(check.controlMappings ?? []).map((mapping) => (
              <li key={mapping.controlId} className="flex items-center justify-between text-sm">
                <span>{mapping.controlId}</span>
                <span className="text-muted-foreground">{mapping.enforcementLevel}</span>
              </li>
            ))}
            {!check.controlMappings?.length ? (
              <li className="text-muted-foreground">No controls linked.</li>
            ) : null}
          </ul>
        </div>
        <Separator />
        <div>
          <p className="text-xs font-medium text-muted-foreground">Latest Result</p>
          {check.latestResult ? (
            <div className="mt-2 rounded-md border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{check.latestResult.status}</span>
                <span>{new Date(check.latestResult.executedAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">Publication: {check.latestResult.publicationState}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No executions recorded.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metadata({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
