import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";

const chartConfig = {
  posture: {
    label: "Posture Score",
    theme: {
      light: "hsl(var(--chart-1))",
      dark: "hsl(var(--chart-1))",
    },
  },
};

export function FrameworkTrendChart({ trend, summary }) {
  const data = buildTrendData(trend);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Posture Trend</CardTitle>
        <CardDescription>Aggregate control scoring trend over the last month.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={chartConfig} className="h-64">
            <AreaChart data={data} margin={{ left: 12, right: 12 }} height={240}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis
                tickFormatter={(value) => `${value}%`}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <ChartTooltip cursor={{ strokeDasharray: "3 3" }} content={<ChartTooltipContent hideLabel />} />
              <Area
                type="monotone"
                dataKey="posture"
                stroke="var(--color-posture)"
                fill="var(--color-posture)"
                fillOpacity={0.15}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No trend data yet. Run controls to populate this chart.
          </div>
        )}
        {summary ? (
          <div className="mt-4 text-sm text-muted-foreground">
            Last score:{" "}
            <span className="font-medium text-foreground">
              {typeof summary?.postureScore === "number"
                ? `${Math.round(summary.postureScore * 1000) / 10}%`
                : "—"}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function buildTrendData(trend) {
  if (!trend?.labels?.length) return [];
  return trend.labels.map((label, index) => {
    const value = trend.values?.[index] ?? 0;
    return {
      label: formatLabel(label),
      posture: Math.max(0, Math.min(100, Math.round(value * 1000) / 10)),
    };
  });
}

function formatLabel(label) {
  const date = label ? new Date(label) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return label ?? "";
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
