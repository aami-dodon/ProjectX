import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

export function EvidenceFreshnessTable({ freshness = [], expiring = [] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Evidence freshness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {freshness.map((bucket) => (
            <div key={bucket.bucket} className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{bucket.bucket} days</p>
              <p className="text-2xl font-semibold">{bucket.count}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Expiring in 30 days</p>
          {expiring.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evidence items nearing purge.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead>Purge date</TableHead>
                    <TableHead>Uploader</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiring.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.displayName}</TableCell>
                      <TableCell>{item.retentionState}</TableCell>
                      <TableCell>
                        {item.purgeScheduledFor
                          ? new Date(item.purgeScheduledFor).toLocaleDateString()
                          : "--"}
                      </TableCell>
                      <TableCell>{item.uploader?.fullName ?? item.uploader?.email ?? "--"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
