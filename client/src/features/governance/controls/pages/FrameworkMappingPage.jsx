import { useParams } from "react-router-dom";

import { MappingMatrix } from "@/features/governance/controls/components/MappingMatrix";
import { useControlMappings } from "@/features/governance/controls/hooks/useControlMappings";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function FrameworkMappingPage() {
  const { controlId } = useParams();
  const { control, isLoading, saveMappings } = useControlMappings(controlId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Framework Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!control) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Framework Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Control not found or unavailable.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{control.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage framework and requirement coverage for this control. Save updates to refresh governance dashboards
            and risk rollups.
          </p>
        </CardContent>
      </Card>
      <MappingMatrix mappings={control.frameworkMappings ?? []} onSave={(rows) => saveMappings(rows)} />
    </div>
  );
}
