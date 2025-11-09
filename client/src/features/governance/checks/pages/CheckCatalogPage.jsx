import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ControlCoverageChart } from "@/features/governance/components/ControlCoverageChart";
import { Button } from "@/shared/components/ui/button";
import { CheckCatalogTable } from "@/features/governance/checks/components/CheckCatalogTable";
import { CheckDefinitionForm } from "@/features/governance/checks/components/CheckDefinitionForm";
import { CheckSummary } from "@/features/governance/checks/components/CheckSummary";
import { useCheckDefinitions } from "@/features/governance/checks/hooks/useCheckDefinitions";

export function CheckCatalogPage() {
  const {
    checks,
    summary,
    filters,
    setFilters,
    selectedCheck,
    setSelectedCheckId,
    isLoading,
    createDefinition,
    updateDefinition,
    activateDefinition,
    runCheck,
  } = useCheckDefinitions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const navigate = useNavigate();

  const statusSummary = useMemo(() => summary?.status ?? {}, [summary?.status]);

  const handleCreate = async (payload) => {
    setIsSubmitting(true);
    try {
      const record = await createDefinition(payload);
      toast.success(`Created ${record?.name ?? "definition"}`);
    } catch (error) {
      toast.error(error?.message ?? "Unable to create definition");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (checkId, payload) => {
    setIsSubmitting(true);
    try {
      await updateDefinition(checkId, payload);
      toast.success("Definition updated");
    } catch (error) {
      toast.error(error?.message ?? "Unable to update definition");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (checkId) => {
    setIsActivating(true);
    try {
      await activateDefinition(checkId);
      toast.success("Check activated");
    } catch (error) {
      toast.error(error?.message ?? "Unable to activate check");
    } finally {
      setIsActivating(false);
    }
  };

  const handleRun = async (checkId) => {
    setIsRunning(true);
    try {
      await runCheck(checkId, { triggerSource: "console" });
      toast.success("Execution queued");
    } catch (error) {
      toast.error(error?.message ?? "Unable to trigger execution");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[2fr_1.2fr]">
        <div className="space-y-4">
          <CheckCatalogTable
            checks={checks}
            selectedCheckId={selectedCheck?.id}
            onSelect={(check) => setSelectedCheckId(check.id)}
            isLoading={isLoading}
            filters={filters}
            onFilterChange={setFilters}
            summary={statusSummary}
          />
        </div>
        <div className="space-y-4">
          <CheckSummary check={selectedCheck} />
          <Button
            variant="outline"
            className="w-full"
            disabled={!selectedCheck}
            onClick={() => selectedCheck && navigate(`/governance/checks/${selectedCheck.id}/results`)}
          >
            View results
          </Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1.2fr]">
        <CheckDefinitionForm
          selectedCheck={selectedCheck}
          onCreate={handleCreate}
          onSave={handleUpdate}
          onActivate={handleActivate}
          onRun={handleRun}
          isSubmitting={isSubmitting}
          isActivating={isActivating}
          isRunning={isRunning}
        />
        <ControlCoverageChart coverage={summary?.coverage} />
      </div>
    </div>
  );
}
