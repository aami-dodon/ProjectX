import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Pie, PieChart, XAxis, Cell } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import { Skeleton } from "@/shared/components/ui/skeleton";

const STATUS_COLOR_MAP = {
  ACTIVE: "var(--color-chart-1)",
  PENDING_VERIFICATION: "var(--color-chart-2)",
  SUSPENDED: "var(--color-chart-3)",
  INVITED: "var(--color-chart-4)",
};

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const sanitizeChartKey = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getFallbackColor = (identifier) => {
  if (!identifier) {
    return "var(--color-muted)";
  }

  const normalized = identifier.toString().toUpperCase();
  const hash = Array.from(normalized).reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return CHART_COLORS[hash % CHART_COLORS.length];
};

export function UserCharts({ statusDistribution = [], monthlyRegistrations = [], isLoading = false }) {
  const normalizedStatusDistribution = useMemo(
    () =>
      statusDistribution.map((entry, index) => {
        const label = entry.label ?? entry.status ?? "Unknown";
        const identifier = entry.status ?? label ?? `status-${index}`;
        const color = STATUS_COLOR_MAP[entry.status] ?? getFallbackColor(identifier);
        const chartKey = sanitizeChartKey(identifier) || `status-${index}`;

        return {
          ...entry,
          label,
          color,
          chartKey,
        };
      }),
    [statusDistribution]
  );

  const statusConfig = useMemo(
    () =>
      normalizedStatusDistribution.reduce((acc, entry, index) => {
        const key = entry.chartKey || `status-${index}`;

        acc[key] = {
          label: entry.label,
          color: entry.color,
        };

        if (entry.label && !(entry.label in acc)) {
          acc[entry.label] = {
            label: entry.label,
          };
        }

        return acc;
      }, {}),
    [normalizedStatusDistribution]
  );

  const registrationConfig = useMemo(
    () => ({
      registrations: {
        label: "Registrations",
        color: "var(--color-chart-5)",
      },
    }),
    []
  );

  // Memoize tooltip content elements to avoid creating new instances each render
  const pieTooltip = useMemo(() => <ChartTooltipContent hideLabel />, []);
  const areaTooltip = useMemo(() => <ChartTooltipContent indicator="dot" />, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Status distribution</CardTitle>
          <CardDescription>Breakdown of users by their current state</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[280px] items-center justify-center">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ChartContainer config={statusConfig} className="h-[240px] w-full">
              <PieChart>
                <ChartTooltip content={pieTooltip} />
                <Pie data={statusDistribution} dataKey="value" nameKey="label" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`${entry.status}-${index}`} fill={STATUS_COLOR_MAP[entry.status] ?? "var(--color-muted)"} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>New registrations</CardTitle>
          <CardDescription>Monthly invites and activations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ChartContainer config={registrationConfig} className="h-[240px]">
              <AreaChart data={monthlyRegistrations}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <ChartTooltip content={areaTooltip} />
                <Area
                  dataKey="value"
                  type="monotone"
                  stroke="var(--color-registrations)"
                  fill="var(--color-registrations)"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Registrations"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
