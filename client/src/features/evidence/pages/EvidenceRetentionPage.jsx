import { useEvidenceRetention } from "@/features/evidence/hooks/useEvidenceRetention";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const RETENTION_STATES = ["ACTIVE", "ARCHIVED", "LEGAL_HOLD", "PURGE_SCHEDULED"];

export function EvidenceRetentionPage() {
  const { summary, isLoading } = useEvidenceRetention();
  const stats = summary?.stats ?? {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Retention overview</h1>
        <p className="text-sm text-muted-foreground">
          Track legal holds, scheduled purges, and policy adoption before audits land.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {RETENTION_STATES.map((state) => (
          <Card key={state}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground">{state}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {stats[state] ?? 0}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Policies</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Retention</TableHead>
                  <TableHead>Legal hold</TableHead>
                  <TableHead className="text-right">Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary?.policies?.length ? (
                  summary.policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">
                        {policy.name}
                        {policy.isDefault && <Badge variant="outline" className="ml-2">Default</Badge>}
                      </TableCell>
                      <TableCell>{policy.retentionMonths} months</TableCell>
                      <TableCell>{policy.legalHoldAllowed ? "Allowed" : "Restricted"}</TableCell>
                      <TableCell className="text-right">{policy.evidenceCount}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      {isLoading ? "Loading policies…" : "No retention policies yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming purges</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Policy</TableHead>
                  <TableHead>Scheduled for</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary?.upcoming?.length ? (
                  summary.upcoming.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell>{entry.retentionPolicy?.name ?? "—"}</TableCell>
                      <TableCell>{entry.purgeScheduledFor ? new Date(entry.purgeScheduledFor).toLocaleString() : "—"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      {isLoading ? "Loading schedule…" : "No upcoming purges."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
