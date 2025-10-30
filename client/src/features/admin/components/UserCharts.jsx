import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Pie, PieChart, XAxis, Cell } from "recharts";

import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
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

  const registrationChartConfig = useMemo(
    () => ({
      registrations: {
        label: "Registrations",
        color: "var(--color-chart-5)",
      },
    }),
    []
  );

  const pieTooltip = useMemo(() => <ChartTooltipContent hideLabel />, []);

  const normalizedRegistrations = useMemo(() => {
    const sorted = [...monthlyRegistrations].sort((a, b) => {
      const dateA = a.date ?? a.key;
      const dateB = b.date ?? b.key;
      const parsedA = new Date(dateA);
      const parsedB = new Date(dateB);
      const timeA = Number.isNaN(parsedA.getTime()) ? 0 : parsedA.getTime();
      const timeB = Number.isNaN(parsedB.getTime()) ? 0 : parsedB.getTime();
      return timeA - timeB;
    });

    return sorted.map((entry, index) => {
      const rawDate = entry.date ?? entry.key;
      let isoDate = null;
      if (rawDate) {
        const parsedDate = new Date(rawDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          isoDate = parsedDate.toISOString().slice(0, 10);
        }
      }

      return {
        ...entry,
        date: isoDate,
        value: entry.value ?? 0,
        registrations: entry.value ?? 0,
        chartKey: entry.chartKey ?? `registration-${index}`,
      };
    });
  }, [monthlyRegistrations]);

  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState("90d");

  const handleTimeRangeChange = useCallback((value) => {
    if (value) {
      setTimeRange(value);
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredRegistrations = useMemo(() => {
    if (normalizedRegistrations.length === 0) {
      return [];
    }

    const referenceDate = normalizedRegistrations.reduce((latest, entry) => {
      if (!entry.date) {
        return latest;
      }

      const entryDate = new Date(entry.date);
      if (!latest || entryDate > latest) {
        return entryDate;
      }

      return latest;
    }, null);

    if (!referenceDate) {
      return [];
    }

    const daysToSubtract = timeRange === "30d" ? 30 : timeRange === "7d" ? 7 : 90;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return normalizedRegistrations.filter((entry) => {
      if (!entry.date) {
        return false;
      }

      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= referenceDate;
    });
  }, [normalizedRegistrations, timeRange]);

  const areaTooltip = useMemo(
    () => (
      <ChartTooltipContent
        indicator="dot"
        labelFormatter={(value) =>
          new Date(value).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        }
      />
    ),
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
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>New registrations</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">Registrations for the last 3 months</span>
            <span className="@[540px]/card:hidden">Last 3 months</span>
          </CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={handleTimeRangeChange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            >
              <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
              <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
              <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Select a value"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ChartContainer config={registrationChartConfig} className="aspect-auto h-[250px] w-full">
              <AreaChart data={filteredRegistrations}>
                <defs>
                  <linearGradient id="fillRegistrations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-registrations)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-registrations)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    if (!value) {
                      return "";
                    }

                    const date = new Date(value);
                    return Number.isNaN(date.getTime())
                      ? value
                      : date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                  }}
                />
                <ChartTooltip cursor={false} content={areaTooltip} />
                <Area
                  dataKey="registrations"
                  type="natural"
                  fill="url(#fillRegistrations)"
                  stroke="var(--color-registrations)"
                  name="Registrations"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
