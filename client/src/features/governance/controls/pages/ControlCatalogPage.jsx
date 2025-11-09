import { useMemo } from "react";

import { ControlCatalogTable } from "@/features/governance/controls/components/ControlCatalogTable";
import { ControlDetailPanel } from "@/features/governance/controls/components/ControlDetailPanel";
import { ControlForm } from "@/features/governance/controls/components/ControlForm";
import { RemediationTaskList } from "@/features/governance/controls/components/RemediationTaskList";
import { ScoreTrendChart } from "@/features/governance/controls/components/ScoreTrendChart";
import { useControls } from "@/features/governance/controls/hooks/useControls";
import { useControlScores } from "@/features/governance/controls/hooks/useControlScores";

export function ControlCatalogPage() {
  const {
    controls,
    summary,
    filters,
    setFilters,
    selectedControl,
    setSelectedControlId,
    isLoading,
    createDefinition,
    updateDefinition,
    archiveDefinition,
    triggerRemediation,
  } = useControls();

  const selectedControlId = selectedControl?.id ?? null;
  const { scores, granularity, setGranularity, isLoading: isScoreLoading } = useControlScores(
    selectedControlId,
    "WEEKLY",
  );

  const handleSelect = (control) => {
    setSelectedControlId(control?.id ?? null);
  };

  const remediationHistory = useMemo(() => selectedControl?.remediation?.history ?? [], [selectedControl]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ControlCatalogTable
            controls={controls}
            summary={summary}
            filters={filters}
            onFilterChange={setFilters}
            selectedControlId={selectedControlId}
            onSelect={handleSelect}
            isLoading={isLoading}
          />
        </div>
        <ControlForm
          selectedControl={selectedControl}
          onCreate={createDefinition}
          onSave={updateDefinition}
          onArchive={archiveDefinition}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ControlDetailPanel control={selectedControl} isLoading={isLoading} />
        </div>
        <ScoreTrendChart
          scores={scores}
          granularity={granularity}
          onGranularityChange={setGranularity}
          isLoading={isScoreLoading}
        />
      </div>
      <RemediationTaskList
        history={remediationHistory}
        onTrigger={(payload) => selectedControlId && triggerRemediation(selectedControlId, payload)}
      />
    </div>
  );
}
