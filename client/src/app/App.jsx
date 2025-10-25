import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import useHealthData from '../features/health/hooks/useHealthData';
import HealthStatus from '../features/health/components/HealthStatus';
import EmailTestForm from '../features/email/components/EmailTestForm';
import MinioUploadForm from '../features/storage/components/MinioUploadForm';
import useTheme from '../hooks/useTheme';
import ThemeReference from '../routes/ThemeReference';
import { Button, buttonVariants } from '../components/ui/button';

const HomePage = () => (
  <div className="flex min-h-[calc(100vh-2*var(--space-xl))] items-center justify-center py-[calc(var(--space-xl)+var(--space-lg))]">
    <h1 className="h1">Hello world</h1>
  </div>
);

const HealthPage = () => {
  const { data, loading, error, refresh } = useHealthData();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-xl py-[calc(var(--space-xl)+var(--space-lg))]">
      <header className="flex flex-col gap-sm">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <h1 className="h1">Operational Health Dashboard</h1>
          <div className="flex flex-wrap items-center gap-sm">
            <Link to="/" className={buttonVariants({ variant: 'ghost' })}>
              Back to home
            </Link>
            <Link to="/theme" className={buttonVariants({ variant: 'outline' })}>
              View theme reference
            </Link>
            <Button type="button" variant="secondary" onClick={toggleTheme}>
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </Button>
          </div>
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
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/theme" element={<ThemeReference />} />
      </Routes>
    </main>
  </div>
);

export default App;
