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
  error: 'text-destructive',
  unknown: 'text-muted',
};

const StatusPill = ({ label, status }) => (
  <span
    className={`inline-flex items-center rounded-full bg-muted/40 px-md py-xs eyebrow ${
      statusColors[status] || statusColors.unknown
    }`}
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
      <div className="flex items-center justify-between gap-lg">
        <div>
          <CardTitle>
            <HeartPulse className="h-5 w-5 text-success" />
            Platform Health
          </CardTitle>
          <CardDescription>
            Comprehensive diagnostics spanning database, storage, email, DNS, and infrastructure metrics.
          </CardDescription>
        </div>
        <Button variant="secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="mt-xl grid gap-lg md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <HeartPulse className="h-4 w-4" /> Overall
            </span>
            <StatusPill label={data?.status || 'unknown'} status={data?.status ?? 'unknown'} />
          </div>
          <p className="mt-md metric">
            {typeof data?.latencyMs === 'number' ? `${data.latencyMs.toFixed(2)} ms` : '--'}
          </p>
          <p className="mt-xs caption text-muted">Latency / response time</p>
        </div>

        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <Server className="h-4 w-4" /> Environment
            </span>
            <StatusPill label={data?.environment?.name ?? 'unknown'} status={data?.status ?? 'unknown'} />
          </div>
          <p className="mt-md body-lg">{data?.environment?.name ?? '--'}</p>
          <p className="mt-xs caption text-muted">
            Build:{' '}
            {data?.environment?.buildTimestamp
              ? new Date(data.environment.buildTimestamp).toLocaleString()
              : 'Not set'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="body-sm text-muted">Uptime</span>
            <StatusPill label={data?.status || 'unknown'} status={data?.status ?? 'unknown'} />
          </div>
          <p className="mt-md metric">{data?.uptime?.humanized ?? '--'}</p>
          <p className="mt-xs caption text-muted">
            Started: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : '--'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <Gauge className="h-4 w-4" /> API
            </span>
            <StatusPill label={data?.api?.status ?? 'unknown'} status={data?.api?.status ?? 'unknown'} />
          </div>
          <p className="mt-md body-md">{data?.api?.message ?? 'No diagnostics available'}</p>
          <p className="mt-xs caption text-muted">Endpoint responsive</p>
        </div>
      </div>

      <div className="mt-xl grid gap-lg md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <Database className="h-4 w-4" /> Database
            </span>
            <StatusPill label={data?.database?.status ?? 'unknown'} status={data?.database?.status ?? 'unknown'} />
          </div>
          <div className="mt-md space-y-sm">
            <p className="flex justify-between caption text-muted">
              <span>Connection</span>
              <span className={`${getStatusClass(data?.database?.connection?.status)} caption`}>
                {data?.database?.connection?.status ?? 'unknown'}
              </span>
            </p>
            <p className="flex justify-between caption text-muted">
              <span>Query (SELECT 1)</span>
              <span className={`${getStatusClass(data?.database?.query?.status)} caption`}>
                {data?.database?.query?.status ?? 'unknown'}
              </span>
            </p>
            {data?.database?.query?.error && <p className="caption text-destructive">{data.database.query.error}</p>}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <Cloud className="h-4 w-4" /> MinIO
            </span>
            <StatusPill label={data?.minio?.status ?? 'unknown'} status={data?.minio?.status ?? 'unknown'} />
          </div>
          <div className="mt-md space-y-sm">
            <p className="caption text-muted">
              Bucket:
              <span className="block body-sm">{data?.minio?.bucket ?? '--'}</span>
            </p>
            <p className="flex justify-between caption text-muted">
              <span>Bucket status</span>
              <span className={`${getStatusClass(data?.minio?.bucketCheck?.status)} caption`}>
                {data?.minio?.bucketCheck?.status ?? 'unknown'}
              </span>
            </p>
            <p className="flex justify-between caption text-muted">
              <span>Connection</span>
              <span className={`${getStatusClass(data?.minio?.connection?.status)} caption`}>
                {data?.minio?.connection?.status ?? 'unknown'}
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <MailCheck className="h-4 w-4" /> Email
            </span>
            <StatusPill label={data?.email?.status ?? 'unknown'} status={data?.email?.status ?? 'unknown'} />
          </div>
          <p className="mt-md body-sm text-muted">SMTP connectivity verified from the server.</p>
          {data?.email?.error && <p className="mt-xs caption text-destructive">{data.email.error}</p>}
        </div>

        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <Network className="h-4 w-4" /> DNS
            </span>
            <StatusPill label={data?.dns?.status ?? 'unknown'} status={data?.dns?.status ?? 'unknown'} />
          </div>
          <ul className="mt-md space-y-xs">
            {dnsRecords.length === 0 && <li>No DNS records resolved.</li>}
            {dnsRecords.map((record) => (
              <li key={`${record.name}-${record.address ?? record.error}`} className="flex flex-col">
                <span className="body-sm">{record.name}</span>
                <span className="caption text-muted">
                  {record.error ? record.error : `${record.address} (IPv${record.family})`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <Server className="h-4 w-4" /> CORS
            </span>
            <StatusPill label={data?.cors?.status ?? 'unknown'} status={data?.cors?.status ?? 'unknown'} />
          </div>
          <p className="mt-md caption text-muted">
            Allowed origins:
            <span className="block body-sm">
              {(data?.cors?.allowedOrigins ?? []).join(', ') || 'None configured'}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-xl grid gap-lg md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <Cpu className="h-4 w-4" /> CPU usage
            </span>
            <StatusPill label={data?.system?.status ?? 'unknown'} status={data?.system?.status ?? 'unknown'} />
          </div>
          <p className="mt-md metric">
            {typeof data?.system?.cpu?.utilization === 'number'
              ? `${data.system.cpu.utilization}%`
              : '--'}
          </p>
          <p className="mt-xs caption text-muted">
            Load averages: {(data?.system?.cpu?.loadAverage ?? []).join(', ')}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <BarChart3 className="h-4 w-4" /> Memory usage
            </span>
            <StatusPill label={data?.system?.status ?? 'unknown'} status={data?.system?.status ?? 'unknown'} />
          </div>
          <p className="mt-md metric">
            {typeof data?.system?.memory?.utilization === 'number'
              ? `${data.system.memory.utilization}%`
              : '--'}
          </p>
          <p className="mt-xs caption text-muted">
            Used {data?.system?.memory?.usedHuman ?? '--'} of {data?.system?.memory?.totalHuman ?? '--'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card/80 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted">
              <HardDrive className="h-4 w-4" /> Disk space
            </span>
            <StatusPill label={data?.system?.status ?? 'unknown'} status={data?.system?.status ?? 'unknown'} />
          </div>
          {disk ? (
            <>
              <p className="mt-md metric">
                {typeof disk.usage === 'number' ? `${disk.usage}%` : '--'}
              </p>
              <p className="mt-xs caption text-muted">
                Used {disk.usedHuman} of {disk.totalHuman}
              </p>
            </>
          ) : (
            <p className="mt-md body-sm text-muted">Disk metrics are not available on this platform.</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-xl flex items-center gap-sm rounded-lg border border-dashed border-warning bg-warning/10 p-lg text-warning body-sm">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
    </Card>
  );
};

export default HealthStatus;
