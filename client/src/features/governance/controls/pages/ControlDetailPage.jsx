import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { ControlDetailPanel } from "@/features/governance/controls/components/ControlDetailPanel";
import { RemediationTaskList } from "@/features/governance/controls/components/RemediationTaskList";
import { ScoreTrendChart } from "@/features/governance/controls/components/ScoreTrendChart";
import { useControlScores } from "@/features/governance/controls/hooks/useControlScores";
import { getControl, triggerControlRemediation } from "@/features/governance/controls/api/controlsClient";

export function ControlDetailPage() {
  const { controlId } = useParams();
  const [control, setControl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { scores, granularity, setGranularity, isLoading: isScoreLoading } = useControlScores(
    controlId,
    "WEEKLY",
  );

  const load = useCallback(async () => {
    if (!controlId) return;
    setIsLoading(true);
    setError(null);
    try {
      const record = await getControl(controlId);
      setControl(record ?? null);
    } catch (err) {
      setError(err);
      setControl(null);
    } finally {
      setIsLoading(false);
    }
  }, [controlId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemediation = async (payload) => {
    if (!controlId) return;
    await triggerControlRemediation(controlId, payload);
    await load();
  };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
        <p className="font-semibold text-destructive">Unable to load control</p>
        <p className="text-destructive/80">{error.message ?? "Unexpected error"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ControlDetailPanel control={control} isLoading={isLoading} />
      <ScoreTrendChart
        scores={scores}
        granularity={granularity}
        onGranularityChange={setGranularity}
        isLoading={isScoreLoading}
      />
      <RemediationTaskList
        history={control?.remediation?.history ?? []}
        onTrigger={handleRemediation}
      />
    </div>
  );
}
