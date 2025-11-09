import { IconArrowUpRight } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const RISK_VARIANTS = {
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "outline",
};

export function ControlDrilldownPanel({ controls = [] }) {
  const navigate = useNavigate();

  const handleNavigate = (controlId) => {
    if (!controlId) return;
    navigate(`/governance/controls/${controlId}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Controls needing attention</CardTitle>
        <Badge variant="outline">{controls.length} tracked</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {controls.length ? (
          controls.map((control) => (
            <div
              key={control.id ?? control.slug}
              className="rounded-lg border p-4 md:flex md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold">{control.title}</p>
                  {control.riskTier ? (
                    <Badge variant={RISK_VARIANTS[control.riskTier] ?? "outline"}>{control.riskTier}</Badge>
                  ) : null}
                  {control.classification ? (
                    <Badge variant="secondary">{control.classification.replaceAll("_", " ")}</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{control.slug}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {control.frameworks?.length
                    ? `Mapped to ${control.frameworks.map((fw) => fw.title).join(", ")}`
                    : "No framework mappings"}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-4 md:mt-0">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Score</p>
                  <p className="text-2xl font-semibold">
                    {typeof control.score === "number" ? `${Math.round(control.score * 100)}%` : "—"}
                  </p>
                  {typeof control.delta === "number" ? (
                    <p className="text-xs text-muted-foreground">
                      {control.delta > 0 ? "+" : ""}
                      {Math.round(control.delta * 100)} pts vs prev
                    </p>
                  ) : null}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleNavigate(control.id)} title="Open control">
                  <IconArrowUpRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No failing controls detected. Scoreboard will update after the next run.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
