import { memo, useMemo } from "react";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

export const ScoreGauge = memo(function ScoreGauge({ label, score, trend }) {
  const percent = typeof score === "number" ? Math.round(score * 100) : null;
  const data = useMemo(
    () => [
      {
        name: "score",
        value: percent ?? 0,
        fill:
          percent >= 85
            ? "hsl(var(--chart-1))"
            : percent >= 60
              ? "hsl(var(--chart-2))"
              : "hsl(var(--destructive))",
      },
    ],
    [percent]
  );

  const trendLabel = (() => {
    if (!trend || typeof trend.delta !== "number") return null;
    const direction = trend.delta > 0 ? "improved" : trend.delta < 0 ? "declined" : null;
    if (!direction) return "flat";
    return `${direction} ${Math.abs(trend.delta * 100).toFixed(1)} pts`;
  })();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{label}</CardTitle>
        {trendLabel && (
          <Badge variant={trend?.delta >= 0 ? "outline" : "destructive"}>
            {trend.delta >= 0 ? "+" : "-"}
            {Math.abs(trend.delta * 100).toFixed(1)}%
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={18}
              data={data}
              startAngle={220}
              endAngle={-40}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={10} background clockWise />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center">
          <p className="text-4xl font-semibold">{percent !== null ? `${percent}%` : "--"}</p>
          <p className="text-sm text-muted-foreground">
            {trendLabel ?? "No recent delta"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
