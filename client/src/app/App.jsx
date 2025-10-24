import React from 'react';
import { Routes, Route } from 'react-router-dom';
import useHealthData from '../features/health/hooks/useHealthData';
import HealthStatus from '../features/health/components/HealthStatus';
import EmailTestForm from '../features/email/components/EmailTestForm';
import MinioUploadForm from '../features/storage/components/MinioUploadForm';
import useTheme from '../hooks/useTheme';

const HealthPage = () => {
  const { data, loading, error, refresh } = useHealthData();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-xl py-[calc(var(--space-xl)+var(--space-lg))]">
      <header className="flex flex-col gap-sm">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <h1 className="h1">Operational Health Dashboard</h1>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-xs rounded-md border border-border bg-secondary px-sm py-xs text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>
        <p className="body-sm text-muted">
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
