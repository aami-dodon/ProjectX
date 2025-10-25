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
  ok: 'text-success-600',
  warning: 'text-warning-600',
  degraded: 'text-warning-700',
  error: 'text-destructive-500',
  unknown: 'text-muted-foreground',
};

const StatusPill = ({ label, status }) => (
  <span
    className={`inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-md py-xs text-xs font-semibold uppercase tracking-wide ${
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
            <HeartPulse className="h-5 w-5 text-primary" />
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
        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <HeartPulse className="h-4 w-4" /> Overall
            </span>
            <StatusPill label={data?.status || 'unknown'} status={data?.status ?? 'unknown'} />
          </div>
          <p className="mt-md metric">
            {typeof data?.latencyMs === 'number' ? `${data.latencyMs.toFixed(2)} ms` : '--'}
          </p>
          <p className="mt-xs caption text-muted-foreground">Latency / response time</p>
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <Server className="h-4 w-4" /> Environment
            </span>
            <StatusPill label={data?.environment?.name ?? 'unknown'} status={data?.status ?? 'unknown'} />
          </div>
          <p className="mt-md body-lg">{data?.environment?.name ?? '--'}</p>
          <p className="mt-xs caption text-muted-foreground">
            Build:{' '}
            {data?.environment?.buildTimestamp
              ? new Date(data.environment.buildTimestamp).toLocaleString()
              : 'Not set'}
          </p>
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="body-sm text-muted-foreground">Uptime</span>
            <StatusPill label={data?.status || 'unknown'} status={data?.status ?? 'unknown'} />
          </div>
          <p className="mt-md metric">{data?.uptime?.humanized ?? '--'}</p>
          <p className="mt-xs caption text-muted-foreground">
            Started: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : '--'}
          </p>
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <Gauge className="h-4 w-4" /> API
            </span>
            <StatusPill label={data?.api?.status ?? 'unknown'} status={data?.api?.status ?? 'unknown'} />
          </div>
          <p className="mt-md body-md">{data?.api?.message ?? 'No diagnostics available'}</p>
          <p className="mt-xs caption text-muted-foreground">Endpoint responsive</p>
        </div>
      </div>

      <div className="mt-xl grid gap-lg md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <Database className="h-4 w-4" /> Database
            </span>
            <StatusPill label={data?.database?.status ?? 'unknown'} status={data?.database?.status ?? 'unknown'} />
          </div>
          <div className="mt-md space-y-sm">
            <p className="flex justify-between caption text-muted-foreground">
              <span>Connection</span>
              <span className={`${getStatusClass(data?.database?.connection?.status)} caption`}>
                {data?.database?.connection?.status ?? 'unknown'}
              </span>
            </p>
            <p className="flex justify-between caption text-muted-foreground">
              <span>Query (SELECT 1)</span>
              <span className={`${getStatusClass(data?.database?.query?.status)} caption`}>
                {data?.database?.query?.status ?? 'unknown'}
              </span>
            </p>
            {data?.database?.query?.error && <p className="caption text-destructive">{data.database.query.error}</p>}
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <Cloud className="h-4 w-4" /> MinIO
            </span>
            <StatusPill label={data?.minio?.status ?? 'unknown'} status={data?.minio?.status ?? 'unknown'} />
          </div>
          <div className="mt-md space-y-sm">
            <p className="caption text-muted-foreground">
              Bucket:
              <span className="block body-sm">{data?.minio?.bucket ?? '--'}</span>
            </p>
            <p className="flex justify-between caption text-muted-foreground">
              <span>Bucket status</span>
              <span className={`${getStatusClass(data?.minio?.bucketCheck?.status)} caption`}>
                {data?.minio?.bucketCheck?.status ?? 'unknown'}
              </span>
            </p>
            <p className="flex justify-between caption text-muted-foreground">
              <span>Connection</span>
              <span className={`${getStatusClass(data?.minio?.connection?.status)} caption`}>
                {data?.minio?.connection?.status ?? 'unknown'}
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <MailCheck className="h-4 w-4" /> Email
            </span>
            <StatusPill label={data?.email?.status ?? 'unknown'} status={data?.email?.status ?? 'unknown'} />
          </div>
          <p className="mt-md body-sm text-muted-foreground">SMTP connectivity verified from the server.</p>
          {data?.email?.error && <p className="mt-xs caption text-destructive">{data.email.error}</p>}
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <Network className="h-4 w-4" /> DNS
            </span>
            <StatusPill label={data?.dns?.status ?? 'unknown'} status={data?.dns?.status ?? 'unknown'} />
          </div>
          <ul className="mt-md space-y-xs">
            {dnsRecords.length === 0 && <li>No DNS records resolved.</li>}
            {dnsRecords.map((record) => (
              <li key={`${record.name}-${record.address ?? record.error}`} className="flex flex-col">
                <span className="body-sm">{record.name}</span>
                <span className="caption text-muted-foreground">
                  {record.error ? record.error : `${record.address} (IPv${record.family})`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <Server className="h-4 w-4" /> CORS
            </span>
            <StatusPill label={data?.cors?.status ?? 'unknown'} status={data?.cors?.status ?? 'unknown'} />
          </div>
          <p className="mt-md caption text-muted-foreground">
            Allowed origins:
            <span className="block body-sm">
              {(data?.cors?.allowedOrigins ?? []).join(', ') || 'None configured'}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-xl grid gap-lg md:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <Cpu className="h-4 w-4" /> CPU usage
            </span>
            <StatusPill label={data?.system?.status ?? 'unknown'} status={data?.system?.status ?? 'unknown'} />
          </div>
          <p className="mt-md metric">
            {typeof data?.system?.cpu?.utilization === 'number'
              ? `${data.system.cpu.utilization}%`
              : '--'}
          </p>
          <p className="mt-xs caption text-muted-foreground">
            Load averages: {(data?.system?.cpu?.loadAverage ?? []).join(', ')}
          </p>
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" /> Memory usage
            </span>
            <StatusPill label={data?.system?.status ?? 'unknown'} status={data?.system?.status ?? 'unknown'} />
          </div>
          <p className="mt-md metric">
            {typeof data?.system?.memory?.utilization === 'number'
              ? `${data.system.memory.utilization}%`
              : '--'}
          </p>
          <p className="mt-xs caption text-muted-foreground">
            Used {data?.system?.memory?.usedHuman ?? '--'} of {data?.system?.memory?.totalHuman ?? '--'}
          </p>
        </div>

        <div className="rounded-lg border border-border/70 bg-card/90 p-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-sm body-sm text-muted-foreground">
              <HardDrive className="h-4 w-4" /> Disk space
            </span>
            <StatusPill label={data?.system?.status ?? 'unknown'} status={data?.system?.status ?? 'unknown'} />
          </div>
          {disk ? (
            <>
              <p className="mt-md metric">
                {typeof disk.usage === 'number' ? `${disk.usage}%` : '--'}
              </p>
              <p className="mt-xs caption text-muted-foreground">
                Used {disk.usedHuman} of {disk.totalHuman}
              </p>
            </>
          ) : (
            <p className="mt-md body-sm text-muted-foreground">Disk metrics are not available on this platform.</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-xl flex items-center gap-sm rounded-lg border border-dashed border-warning-500 bg-warning-100 p-lg text-warning-800 body-sm">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
    </Card>
  );
};

export default HealthStatus;
