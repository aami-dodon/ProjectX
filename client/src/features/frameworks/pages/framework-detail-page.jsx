import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { ControlList } from "@/features/frameworks/components/control-list";
import {
  createFrameworkControl,
  fetchFramework,
  fetchFrameworkControls,
  retireFramework as retireFrameworkRequest,
  restoreFramework as restoreFrameworkRequest,
} from "@/features/frameworks/api/frameworks-client";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function FrameworkDetailPage() {
  const { frameworkId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [controls, setControls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingControl, setIsSavingControl] = useState(false);
  const [isLifecycleBusy, setIsLifecycleBusy] = useState(false);

  const load = useCallback(async () => {
    if (!frameworkId) return;
    setIsLoading(true);
    try {
      const [detailResponse, controlResponse] = await Promise.all([
        fetchFramework(frameworkId),
        fetchFrameworkControls(frameworkId),
      ]);
      setData(detailResponse?.data ?? null);
      setControls(controlResponse?.data ?? []);
    } catch (error) {
      toast.error(error?.message ?? "Unable to load framework");
    } finally {
      setIsLoading(false);
    }
  }, [frameworkId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateControl = async (payload) => {
    setIsSavingControl(true);
    try {
      await createFrameworkControl(frameworkId, payload);
      toast.success("Control created");
      await load();
    } catch (error) {
      toast.error(error?.message ?? "Unable to create control");
    } finally {
      setIsSavingControl(false);
    }
  };

  const handleRetireFramework = async () => {
    if (!frameworkId) return;
    const confirmed = window.confirm("Retire this framework? Controls and mappings will remain available for reporting.");
    if (!confirmed) return;

    const reason = window.prompt("Add a retirement note (optional)") ?? "";

    setIsLifecycleBusy(true);
    try {
      await retireFrameworkRequest(frameworkId, reason.trim() ? { reason: reason.trim() } : {});
      toast.success("Framework retired");
      await load();
    } catch (error) {
      toast.error(error?.message ?? "Unable to retire framework");
    } finally {
      setIsLifecycleBusy(false);
    }
  };

  const handleRestoreFramework = async () => {
    if (!frameworkId) return;
    const confirmed = window.confirm("Restore this framework and return it to the catalog?");
    if (!confirmed) return;

    setIsLifecycleBusy(true);
    try {
      await restoreFrameworkRequest(frameworkId);
      toast.success("Framework restored");
      await load();
    } catch (error) {
      toast.error(error?.message ?? "Unable to restore framework");
    } finally {
      setIsLifecycleBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Framework not found.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground uppercase">{data.slug}</p>
          <h1 className="text-3xl font-semibold">{data.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {data.publisher && <span>Publisher: {data.publisher}</span>}
            {data.jurisdiction && <span>Jurisdiction: {data.jurisdiction}</span>}
            <Badge variant="secondary">{data.status}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate(`/frameworks/${frameworkId}/mappings`)}>
            Mapping matrix
          </Button>
          <Button variant="outline" onClick={() => navigate(`/frameworks/${frameworkId}/versions`)}>
            Version history
          </Button>
          {data.status === "RETIRED" ? (
            <Button variant="secondary" onClick={handleRestoreFramework} disabled={isLifecycleBusy}>
              Restore framework
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleRetireFramework} disabled={isLifecycleBusy}>
              Retire framework
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <MetadataRow label="Domain" value={data.domain ?? "—"} />
            <MetadataRow
              label="Effective"
              value={
                data.validFrom
                  ? `${new Date(data.validFrom).toLocaleDateString()} ${
                      data.validTo ? `→ ${new Date(data.validTo).toLocaleDateString()}` : ""
                    }`
                  : "—"
              }
            />
            <MetadataRow label="Controls" value={data.stats?.controls ?? 0} />
            <MetadataRow label="Mappings" value={data.stats?.mappings ?? 0} />
            <MetadataRow label="Coverage" value={`${data.stats?.coveragePercent ?? 0}%`} />
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent versions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {(data.timeline ?? []).length ? (
              data.timeline.map((entry) => (
                <div key={entry.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">v{entry.version}</span>
                    <Badge variant="outline">{entry.status}</Badge>
                  </div>
                  {entry.changelog && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{entry.changelog}</p>
                  )}
                  {entry.publishedAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Published {new Date(entry.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No versions published yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ControlList controls={controls} onCreate={handleCreateControl} isBusy={isSavingControl} />
    </div>
  );
}

function MetadataRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
