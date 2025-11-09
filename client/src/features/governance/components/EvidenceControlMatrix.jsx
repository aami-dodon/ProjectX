import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

export function EvidenceControlMatrix({ links = [] }) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Evidence-Control Matrix</CardTitle>
        <CardDescription>Latest evidence bundles tied to controls and checks.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evidence</TableHead>
                <TableHead>Control</TableHead>
                <TableHead>Check</TableHead>
                <TableHead>Linked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.length ? (
                links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="font-medium">{link.evidence?.name ?? "Artifact"}</div>
                      <p className="text-xs text-muted-foreground">
                        {link.evidence?.source ?? "manual"} · {formatSize(link.evidence?.size)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{link.control?.title ?? "—"}</div>
                      <p className="text-xs text-muted-foreground">{link.control?.slug ?? ""}</p>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{link.check?.name ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {link.linkedAt ? new Date(link.linkedAt).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No recent evidence links. Attach artifacts from the Evidence Library to populate this table.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSize(size) {
  if (!size || Number.isNaN(size)) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round((size / 1024) * 10) / 10} KB`;
  return `${Math.round((size / (1024 * 1024)) * 10) / 10} MB`;
}
