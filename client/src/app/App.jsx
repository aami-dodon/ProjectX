import React from 'react';
import { Routes, Route } from 'react-router-dom';
import useHealthData from '../features/health/hooks/useHealthData';
import HealthStatus from '../features/health/components/HealthStatus';
import EmailTestForm from '../features/email/components/EmailTestForm';
import MinioUploadForm from '../features/storage/components/MinioUploadForm';

const HealthPage = () => {
  const { data, loading, error, refresh } = useHealthData();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-xl py-[calc(var(--space-xl)+var(--space-lg))]">
      <header className="flex flex-col gap-sm">
        <h1 className="text-3xl font-bold text-foreground">Operational Health Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          All configuration is sourced from the environment. Use the tools below to verify connectivity for each integration.
        </p>
      </header>

      <HealthStatus data={data} loading={loading} error={error} onRefresh={refresh} />

      <section className="grid gap-xl md:grid-cols-2">
        <EmailTestForm />
        <MinioUploadForm />
      </section>
    </div>
  );
};

const App = () => (
  <div className="min-h-screen bg-background text-foreground">
    <main className="px-lg">
      <Routes>
        <Route path="/" element={<HealthPage />} />
      </Routes>
    </main>
  </div>
);

export default App;
