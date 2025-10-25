import React from 'react';
import useHealthData from '../../features/health/hooks/useHealthData';
import HealthStatus from '../../features/health/components/HealthStatus';
import EmailTestForm from '../../features/health/components/EmailTestForm';
import MinioUploadForm from '../../features/storage/components/MinioUploadForm';
import { ThemeToggleCard } from '../../features/theme';
import { SinglePageLayout, PageHeader } from '../../components/layout/SinglePageLayout';

const HealthPage = () => {
  const { data, loading, error, refresh } = useHealthData();

  return (
    <SinglePageLayout>
      <PageHeader
        title="Operational Health Dashboard"
        description="All configuration is sourced from the environment. Use the tools below to verify connectivity for each integration."
      />

      <ThemeToggleCard />

      <HealthStatus data={data} loading={loading} error={error} onRefresh={refresh} />

      <section className="grid gap-xl md:grid-cols-2">
        <EmailTestForm />
        <MinioUploadForm />
      </section>
    </SinglePageLayout>
  );
};

export default HealthPage;
