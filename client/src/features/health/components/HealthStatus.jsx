import React from 'react';
import { HeartPulse, Database, Cloud, AlertTriangle } from 'lucide-react';
import { Card, CardDescription, CardTitle } from '../../../components/ui/card';
import Button from '../../../components/ui/button';

const statusColors = {
  ok: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
  unknown: 'text-slate-400',
};

const StatusPill = ({ label, status }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
      statusColors[status] || statusColors.unknown
    } bg-slate-800/70`}
  >
    {label}
  </span>
);

const HealthStatus = ({ data, loading, error, onRefresh }) => {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <CardTitle>
            <HeartPulse className="h-5 w-5 text-success" />
            Platform Health
          </CardTitle>
          <CardDescription>
            Monitor service uptime, database connectivity, and MinIO storage readiness.
          </CardDescription>
        </div>
        <Button onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Uptime</span>
            <StatusPill label={data?.status || 'unknown'} status={data?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{data?.uptime?.humanized ?? '--'}</p>
          <p className="mt-1 text-xs text-slate-500">Started: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : '--'}</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Database className="h-4 w-4" /> Database
            </span>
            <StatusPill label={data?.database?.status ?? 'unknown'} status={data?.database?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-lg text-slate-100">{data?.database?.timestamp ? new Date(data.database.timestamp).toLocaleString() : '--'}</p>
          {data?.database?.error && <p className="mt-1 text-xs text-danger">{data.database.error}</p>}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Cloud className="h-4 w-4" /> MinIO
            </span>
            <StatusPill label={data?.minio?.status ?? 'unknown'} status={data?.minio?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-lg text-slate-100">Bucket: {data?.minio?.bucket ?? '--'}</p>
          <p className="mt-1 text-xs text-slate-400">CORS: {data?.minio?.cors?.ok ? 'Configured' : 'Needs attention'}</p>
          {data?.minio?.cors?.message && (
            <p className={`mt-1 text-xs ${data.minio.cors.ok ? 'text-slate-400' : 'text-warning'}`}>
              {data.minio.cors.message}
            </p>
          )}
          {data?.minio?.error && <p className="mt-1 text-xs text-danger">{data.minio.error}</p>}
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-dashed border-warning bg-warning/10 p-4 text-warning">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
    </Card>
  );
};

export default HealthStatus;
