import React from 'react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card.jsx';

function StatCard({ title, value, trend }) {
  return (
    <Card className="@container">
      <div className="space-y-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]:text-3xl">
          {value}
        </CardTitle>
        <div className="text-xs text-muted-foreground">{trend}</div>
      </div>
    </Card>
  );
}

function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
      <StatCard title="Total Revenue" value="$1,250.00" trend="Trending up this month" />
      <StatCard title="New Customers" value="1,234" trend="Down 20% this period" />
      <StatCard title="Active Accounts" value="45,678" trend="Strong user retention" />
      <StatCard title="Growth Rate" value="4.5%" trend="Steady performance increase" />
    </div>
  );
}

export default SectionCards;

