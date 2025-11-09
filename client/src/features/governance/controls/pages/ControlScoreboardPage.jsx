import { useEffect, useMemo, useState } from "react";

import { ScoreTrendChart } from "@/features/governance/controls/components/ScoreTrendChart";
import { useControls } from "@/features/governance/controls/hooks/useControls";
import { useControlScores } from "@/features/governance/controls/hooks/useControlScores";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

export function ControlScoreboardPage() {
  const { controls } = useControls();
  const [activeControlId, setActiveControlId] = useState(null);

  useEffect(() => {
    if (!activeControlId && controls.length) {
      setActiveControlId(controls[0].id);
    }
  }, [activeControlId, controls]);

  const activeControl = useMemo(
    () => controls.find((control) => control.id === activeControlId) ?? null,
    [controls, activeControlId]
  );

  const { scores, granularity, setGranularity, isLoading } = useControlScores(activeControlId, "WEEKLY");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Control Scoreboard</CardTitle>
            <p className="text-sm text-muted-foreground">Trend health for governance-critical controls.</p>
          </div>
          <Select value={activeControlId ?? ""} onValueChange={setActiveControlId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select control" />
            </SelectTrigger>
            <SelectContent>
              {controls.map((control) => (
                <SelectItem key={control.id} value={control.id}>
                  {control.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        {activeControl ? (
          <CardContent className="text-sm">
            <div className="flex flex-wrap gap-4">
              <span className="text-muted-foreground">Slug: {activeControl.slug}</span>
              <span className="text-muted-foreground">Risk: {activeControl.riskTier}</span>
              <span className="text-muted-foreground">Status: {activeControl.status}</span>
            </div>
          </CardContent>
        ) : null}
      </Card>
      <ScoreTrendChart
        scores={scores}
        granularity={granularity}
        onGranularityChange={setGranularity}
        isLoading={isLoading}
      />
    </div>
  );
}
