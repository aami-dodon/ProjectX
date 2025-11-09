import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { MappingEditor } from "@/features/frameworks/components/mapping-editor";
import {
  fetchFramework,
  fetchFrameworks,
} from "@/features/frameworks/api/frameworks-client";
import { useFrameworkMappings } from "@/features/frameworks/hooks/use-framework-mappings";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function MappingMatrixPage() {
  const { frameworkId } = useParams();
  const [framework, setFramework] = useState(null);
  const [peerFrameworks, setPeerFrameworks] = useState([]);
  const [loadingFramework, setLoadingFramework] = useState(true);
  const { mappings, summary, matrix, filters, setFilters, createMapping, isLoading } =
    useFrameworkMappings(frameworkId);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!frameworkId) return;
      setLoadingFramework(true);
      try {
        const [detailResponse, catalogResponse] = await Promise.all([
          fetchFramework(frameworkId),
          fetchFrameworks({ limit: 50 }),
        ]);
        if (!isMounted) return;
        setFramework(detailResponse?.data ?? null);
        setPeerFrameworks((catalogResponse?.data ?? []).filter((entry) => entry.id !== frameworkId));
      } catch (error) {
        toast.error(error?.message ?? "Unable to load framework metadata");
      } finally {
        if (isMounted) setLoadingFramework(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [frameworkId]);

  const handleCreate = async (payload) => {
    try {
      await createMapping(payload);
      toast.success("Mapping saved");
    } catch (error) {
      toast.error(error?.message ?? "Unable to create mapping");
    }
  };

  if (loadingFramework) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!framework) {
    return <p className="text-muted-foreground">Framework not found.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{framework.slug}</p>
          <h1 className="text-3xl font-semibold">Mapping matrix</h1>
          <p className="text-sm text-muted-foreground">
            Align controls between <span className="font-semibold">{framework.title}</span> and peer frameworks.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Controls: {framework.stats?.controls ?? 0}</Badge>
          <Badge variant="outline">Mappings: {framework.stats?.mappings ?? 0}</Badge>
          <Badge variant="outline">Coverage: {framework.stats?.coveragePercent ?? 0}%</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {["EXACT", "PARTIAL", "INFORMATIVE"].map((key) => (
            <div key={key} className="rounded-lg border p-3">
              <p className="text-xs uppercase text-muted-foreground">{key}</p>
              <p className="text-2xl font-semibold">{summary?.byStrength?.[key] ?? 0}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <MappingEditor
        mappings={mappings}
        summary={summary}
        matrix={matrix}
        filters={filters}
        setFilters={setFilters}
        onCreateMapping={handleCreate}
        frameworks={peerFrameworks}
        isSubmitting={isLoading}
      />
      <Button
        variant="outline"
        className="mt-2"
        onClick={() =>
          toast.info(
            "Tip: paste control IDs from the Control Catalog or use the API client to fetch available controls.",
            { duration: 4000 }
          )
        }
      >
        Need help finding control IDs?
      </Button>
    </div>
  );
}
