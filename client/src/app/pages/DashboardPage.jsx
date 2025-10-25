import React from 'react';
import { SectionCards, ChartAreaInteractive, DataTable } from '@/features/dashboard';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';

const DashboardPage = () => {
  const { rows } = useDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable rows={rows} />
    </div>
  );
};

export default DashboardPage;

