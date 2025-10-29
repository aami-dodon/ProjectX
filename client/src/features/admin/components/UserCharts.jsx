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

export function UserCharts({ statusDistribution = [], monthlyRegistrations = [], isLoading = false }) {
  const statusConfig = useMemo(
    () =>
      statusDistribution.reduce((acc, entry) => {
        const key = entry.status.toLowerCase();
        acc[key] = {
          label: entry.label ?? entry.status,
          color: STATUS_COLOR_MAP[entry.status] ?? "var(--color-muted-foreground)",
        };
        return acc;
      }, {}),
    [statusDistribution]
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
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={statusDistribution} dataKey="value" nameKey="label" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {statusDistribution.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLOR_MAP[entry.status] ?? "var(--color-muted)"} />
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
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
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
