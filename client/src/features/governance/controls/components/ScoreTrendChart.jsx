import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";

const GRANULARITIES = ["DAILY", "WEEKLY", "MONTHLY"];

export function ScoreTrendChart({ scores, granularity, onGranularityChange, isLoading }) {
  const data = scores?.data ?? [];
  const summary = scores?.summary ?? {};

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Score Trend</CardTitle>
          <CardDescription>Weighted control performance over time.</CardDescription>
        </div>
        <Select value={granularity} onValueChange={onGranularityChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITIES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-[320px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : data.length ? (
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="windowStart"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                className="text-xs"
              />
              <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} className="text-xs" />
              <Tooltip
                formatter={(value) => `${Math.round(value * 100)}%`}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#scoreGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No score history available.</p>
        )}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">Average</p>
            <p className="text-xl font-semibold">
              {summary.averageScore !== undefined && summary.averageScore !== null
                ? `${Math.round(summary.averageScore * 100)}%`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Latest classification</p>
            <p className="text-xl font-semibold">{summary.latestClassification ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Observations</p>
            <p className="text-xl font-semibold">{summary.sampleSize ?? 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
