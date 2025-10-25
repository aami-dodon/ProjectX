import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useHealthData, EmailTestForm, HealthStatus, MinioUploadForm } from '../../features/health';
import ThemeToggleCard from '../../components/ui/ThemeToggleCard';
import { buttonVariants } from '../../components/ui/button';

const PageHeader = ({ title, eyebrow, description, descriptionClassName }) => {
  return (
    <header className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex flex-col gap-xs">
          {eyebrow ? <span className="eyebrow text-primary">{eyebrow}</span> : null}
          <h1 className="h1">{title}</h1>
        </div>
        <Link
          to="/"
          className={`${buttonVariants({ variant: 'ghost' })} inline-flex items-center gap-xs`}
        >
          <Home className="h-4 w-4" />
          <span>Back to home</span>
        </Link>
      </div>
      {description ? (
        <p className={descriptionClassName ?? 'body-sm text-muted'}>{description}</p>
      ) : null}
    </header>
  );
};

const HealthPage = () => {
  const { data, loading, error, refresh } = useHealthData();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-xl py-[calc(var(--space-xl)+var(--space-lg))]">
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
    </div>
  );
};

export default HealthPage;
