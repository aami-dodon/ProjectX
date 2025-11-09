import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { IconAlertCircle } from "@tabler/icons-react";
import { toast } from "sonner";

import { EvidenceDownloadButton } from "@/features/evidence/components/EvidenceDownloadButton";
import { EvidenceLinkingForm } from "@/features/evidence/components/EvidenceLinkingForm";
import { EvidenceMetadataPanel } from "@/features/evidence/components/EvidenceMetadataPanel";
import { fetchEvidenceDetail, updateEvidenceMetadata, addEvidenceLinks, removeEvidenceLink } from "@/features/evidence/api/evidenceClient";
import { EvidenceTimeline } from "@/features/governance/components/EvidenceTimeline";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function EvidenceDetailPage() {
  const { evidenceId } = useParams();
  const [evidence, setEvidence] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const load = useCallback(async () => {
    if (!evidenceId) return;
    setIsLoading(true);
    try {
      const record = await fetchEvidenceDetail(evidenceId);
      setEvidence(record);
    } catch (error) {
      toast.error(error?.message ?? "Unable to load evidence");
    } finally {
      setIsLoading(false);
    }
  }, [evidenceId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMetadataSave = async (changes) => {
    if (!evidenceId) return;
    setIsSavingMetadata(true);
    try {
      const updated = await updateEvidenceMetadata(evidenceId, { ...changes, bumpVersion: true });
      setEvidence(updated);
      toast.success("Metadata updated");
    } catch (error) {
      toast.error(error?.message ?? "Unable to update metadata");
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const handleAddLinks = async (payload) => {
    if (!evidenceId) return;
    setIsLinking(true);
    try {
      const updated = await addEvidenceLinks(evidenceId, payload);
      setEvidence(updated);
      toast.success("Link added");
    } catch (error) {
      toast.error(error?.message ?? "Unable to add link");
    } finally {
      setIsLinking(false);
    }
  };

  const handleRemoveLink = async (link) => {
    if (!evidenceId || !link?.id) return;
    setIsLinking(true);
    try {
      const updated = await removeEvidenceLink(evidenceId, link.id);
      setEvidence(updated);
      toast.success("Link removed");
    } catch (error) {
      toast.error(error?.message ?? "Unable to remove link");
    } finally {
      setIsLinking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!evidence) {
    return (
      <Card>
        <CardHeader className="flex items-center gap-2">
          <IconAlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Evidence not found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{evidence.name}</h1>
          <p className="text-sm text-muted-foreground">
            Uploaded by {evidence.uploader?.name ?? evidence.uploader?.email ?? "system"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{evidence.retentionState}</Badge>
            <Badge variant="outline">v{evidence.version}</Badge>
            <Badge variant="outline">{evidence.source}</Badge>
          </div>
        </div>
        <EvidenceDownloadButton evidenceId={evidence.id} />
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <EvidenceMetadataPanel evidence={evidence} onSave={handleMetadataSave} isSaving={isSavingMetadata} />
        <Card className="max-h-[500px] overflow-hidden">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[440px] overflow-y-auto">
            <EvidenceTimeline events={evidence.events ?? []} />
          </CardContent>
        </Card>
      </div>

      <EvidenceLinkingForm links={evidence.links ?? []} onAdd={handleAddLinks} onRemove={handleRemoveLink} isSubmitting={isLinking} />
    </div>
  );
}
