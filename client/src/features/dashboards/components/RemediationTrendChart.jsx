import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export function RemediationTrendChart({ data = [] }) {
  const chartData = data.map((item) => ({
    date: item.date,
    completed: item.completed,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Remediation throughput</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No remediation throughput data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip labelFormatter={formatDate} formatter={(value) => [`${value} completed`, ""]} />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1) / 0.25)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
