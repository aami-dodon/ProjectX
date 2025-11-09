import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { FrameworkCoverageHeatmap } from "@/features/governance/components/FrameworkCoverageHeatmap";

export function ControlDetailPanel({ control, isLoading }) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Control Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!control) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Control Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a control to view metadata and mappings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{control.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <MetadataRow label="Slug" value={control.slug} />
          <MetadataRow label="Owner" value={control.ownerTeam ?? '—'} />
          <MetadataRow label="Domain" value={control.taxonomy?.domain ?? '—'} />
          <MetadataRow label="Category" value={control.taxonomy?.category ?? '—'} />
          <MetadataRow label="Sub-category" value={control.taxonomy?.subCategory ?? '—'} />
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Risk: {control.riskTier}</Badge>
            <Badge variant="secondary">Enforcement: {control.enforcementLevel}</Badge>
            <Badge>{control.status}</Badge>
          </div>
          <MetadataRow label="Remediation notes" value={control.remediationNotes || 'None captured'} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Linked Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {control.checkLinks?.length ? (
            control.checkLinks.map((link) => (
              <div key={link.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{link.check?.name ?? link.checkId}</span>
                  <span className="text-xs text-muted-foreground">
                    Enforcement {link.enforcementLevel} • Weight {link.weight ?? 1}
                  </span>
                </div>
                <Badge variant="outline">{link.check?.severity ?? '—'}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No checks linked yet.</p>
          )}
        </CardContent>
      </Card>
      <FrameworkCoverageHeatmap
        className="lg:col-span-2"
        mappings={control.frameworkMappings ?? []}
      />
    </div>
  );
}

function MetadataRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
