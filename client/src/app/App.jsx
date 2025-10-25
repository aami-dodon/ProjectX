import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import useHealthData from '../features/health/hooks/useHealthData';
import HealthStatus from '../features/health/components/HealthStatus';
import EmailTestForm from '../features/email/components/EmailTestForm';
import MinioUploadForm from '../features/storage/components/MinioUploadForm';
import { useTheme } from '../features/theme';
import { Button } from '../components/ui/button';
import { SinglePageLayout, PageHeader } from '../components/layout/SinglePageLayout';

const HomePage = () => (
  <div className="flex min-h-[calc(100vh-2*var(--space-xl))] items-center justify-center py-[calc(var(--space-xl)+var(--space-lg))]">
    <h1 className="h1">Hello world</h1>
  </div>
);

const HealthPage = () => {
  const { data, loading, error, refresh } = useHealthData();
  const { theme, toggleTheme } = useTheme();

  return (
    <SinglePageLayout>
      <PageHeader
        title="Operational Health Dashboard"
        description="All configuration is sourced from the environment. Use the tools below to verify connectivity for each integration."
      />

      <div className="flex flex-wrap items-center justify-between gap-sm rounded-lg border border-border bg-muted/30 px-md py-sm">
        <div className="flex flex-col gap-xs">
          <span className="body-sm font-medium text-foreground">Display mode</span>
          <p className="body-xs text-muted">
            {theme === 'dark'
              ? 'Dark mode tokens are active. Switch to preview the light palette.'
              : 'Light mode tokens are active. Switch to preview the dark palette.'}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={toggleTheme}
          className="inline-flex items-center gap-xs"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
        </Button>
      </div>

      <HealthStatus data={data} loading={loading} error={error} onRefresh={refresh} />

      <section className="grid gap-xl md:grid-cols-2">
        <EmailTestForm />
        <MinioUploadForm />
      </section>
    </SinglePageLayout>
  );
};

const App = () => (
  <div className="min-h-screen bg-background text-foreground">
    <main className="px-lg">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthPage />} />
      </Routes>
    </main>
  </div>
);

export default App;
