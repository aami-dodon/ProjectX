import React from 'react';
import {
  AlertTriangle,
  Cloud,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  HeartPulse,
  MailCheck,
  Network,
  Server,
  BarChart3,
} from 'lucide-react';
import { Card, CardDescription, CardTitle } from '../../../components/ui/card';
import Button from '../../../components/ui/button';

const statusColors = {
  ok: 'text-success',
  warning: 'text-warning',
  degraded: 'text-warning',
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
  const getStatusClass = (status) => statusColors[status] || statusColors.unknown;
  const dnsRecords = data?.dns?.records ?? [];
  const disk = data?.system?.disk;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <CardTitle>
            <HeartPulse className="h-5 w-5 text-success" />
            Platform Health
          </CardTitle>
          <CardDescription>
            Comprehensive diagnostics spanning database, storage, email, DNS, and infrastructure metrics.
          </CardDescription>
        </div>
        <Button onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <HeartPulse className="h-4 w-4" /> Overall
            </span>
            <StatusPill label={data?.status || 'unknown'} status={data?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-100">
            {typeof data?.latencyMs === 'number' ? `${data.latencyMs.toFixed(2)} ms` : '--'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Latency / response time</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Server className="h-4 w-4" /> Environment
            </span>
            <StatusPill label={data?.environment?.name ?? 'unknown'} status={data?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-lg text-slate-100">{data?.environment?.name ?? '--'}</p>
          <p className="mt-1 text-xs text-slate-500">
            Build:{' '}
            {data?.environment?.buildTimestamp
              ? new Date(data.environment.buildTimestamp).toLocaleString()
              : 'Not set'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Uptime</span>
            <StatusPill label={data?.status || 'unknown'} status={data?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-100">{data?.uptime?.humanized ?? '--'}</p>
          <p className="mt-1 text-xs text-slate-500">
            Started: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : '--'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Gauge className="h-4 w-4" /> API
            </span>
            <StatusPill label={data?.api?.status ?? 'unknown'} status={data?.api?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-base text-slate-100">{data?.api?.message ?? 'No diagnostics available'}</p>
          <p className="mt-1 text-xs text-slate-500">Endpoint responsive</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Database className="h-4 w-4" /> Database
            </span>
            <StatusPill label={data?.database?.status ?? 'unknown'} status={data?.database?.status ?? 'unknown'} />
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <p className="flex justify-between text-slate-400">
              <span>Connection</span>
              <span className={getStatusClass(data?.database?.connection?.status)}>
                {data?.database?.connection?.status ?? 'unknown'}
              </span>
            </p>
            <p className="flex justify-between text-slate-400">
              <span>Query (SELECT 1)</span>
              <span className={getStatusClass(data?.database?.query?.status)}>
                {data?.database?.query?.status ?? 'unknown'}
              </span>
            </p>
            {data?.database?.query?.error && <p className="text-danger">{data.database.query.error}</p>}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Cloud className="h-4 w-4" /> MinIO
            </span>
            <StatusPill label={data?.minio?.status ?? 'unknown'} status={data?.minio?.status ?? 'unknown'} />
          </div>
          <div className="mt-3 space-y-2 text-xs text-slate-400">
            <p>
              Bucket:
              <span className="block text-slate-200">{data?.minio?.bucket ?? '--'}</span>
            </p>
            <p className="flex justify-between">
              <span>Bucket status</span>
              <span className={getStatusClass(data?.minio?.bucketCheck?.status)}>
                {data?.minio?.bucketCheck?.status ?? 'unknown'}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Connection</span>
              <span className={getStatusClass(data?.minio?.connection?.status)}>
                {data?.minio?.connection?.status ?? 'unknown'}
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <MailCheck className="h-4 w-4" /> Email
            </span>
            <StatusPill label={data?.email?.status ?? 'unknown'} status={data?.email?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-sm text-slate-400">
            SMTP connectivity verified from the server.
          </p>
          {data?.email?.error && <p className="mt-1 text-xs text-danger">{data.email.error}</p>}
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Network className="h-4 w-4" /> DNS
            </span>
            <StatusPill label={data?.dns?.status ?? 'unknown'} status={data?.dns?.status ?? 'unknown'} />
          </div>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            {dnsRecords.length === 0 && <li>No DNS records resolved.</li>}
            {dnsRecords.map((record) => (
              <li key={`${record.name}-${record.address ?? record.error}`} className="flex flex-col">
                <span className="text-slate-300">{record.name}</span>
                <span>
                  {record.error ? record.error : `${record.address} (IPv${record.family})`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Server className="h-4 w-4" /> CORS
            </span>
            <StatusPill label={data?.cors?.status ?? 'unknown'} status={data?.cors?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Allowed origins:
            <span className="block text-slate-200">
              {(data?.cors?.allowedOrigins ?? []).join(', ') || 'None configured'}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Cpu className="h-4 w-4" /> CPU usage
            </span>
            <StatusPill label={data?.system?.status ?? 'unknown'} status={data?.system?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-100">
            {typeof data?.system?.cpu?.utilization === 'number'
              ? `${data.system.cpu.utilization}%`
              : '--'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Load averages: {(data?.system?.cpu?.loadAverage ?? []).join(', ')}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Memory usage
            </span>
            <StatusPill label={data?.system?.status ?? 'unknown'} status={data?.system?.status ?? 'unknown'} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-100">
            {typeof data?.system?.memory?.utilization === 'number'
              ? `${data.system.memory.utilization}%`
              : '--'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Used {data?.system?.memory?.usedHuman ?? '--'} of {data?.system?.memory?.totalHuman ?? '--'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <HardDrive className="h-4 w-4" /> Disk space
            </span>
            <StatusPill label={data?.system?.status ?? 'unknown'} status={data?.system?.status ?? 'unknown'} />
          </div>
          {disk ? (
            <>
              <p className="mt-3 text-2xl font-semibold text-slate-100">
                {typeof disk.usage === 'number' ? `${disk.usage}%` : '--'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Used {disk.usedHuman} of {disk.totalHuman}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Disk metrics are not available on this platform.</p>
          )}
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
