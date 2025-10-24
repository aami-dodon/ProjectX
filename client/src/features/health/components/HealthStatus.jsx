import PropTypes from 'prop-types';

const formatSeconds = (seconds) => {
  if (!seconds && seconds !== 0) return 'Unknown';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return [
    hrs ? `${hrs}h` : null,
    mins ? `${mins}m` : null,
    `${secs}s`,
  ]
    .filter(Boolean)
    .join(' ');
};

const StatusPill = ({ label, status }) => {
  const palette = {
    ok: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    degraded: 'bg-amber-500/20 text-amber-200 border border-amber-500/40',
    error: 'bg-rose-500/20 text-rose-200 border border-rose-500/40',
    unknown: 'bg-slate-500/20 text-slate-200 border border-slate-500/40',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${palette[status] ?? palette.unknown}`}>
      {label}
    </span>
  );
};

StatusPill.propTypes = {
  label: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
};

const formatLatency = (latencyMs) => {
  if (typeof latencyMs !== 'number' || Number.isNaN(latencyMs)) return 'Unknown';
  return `${latencyMs.toFixed(1)} ms`;
};

const formatPercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Unknown';
  return `${value.toFixed(1)}%`;
};

const formatBytes = (bytes) => {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return 'Unknown';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(1)} ${units[exponent]}`;
};

const deriveOverallSystemStatus = (system) => {
  if (!system) return 'unknown';
  const statuses = [system.cpu?.status, system.memory?.status, system.disk?.status].filter(Boolean);
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('degraded')) return 'degraded';
  if (statuses.length && statuses.every((status) => status === 'ok')) return 'ok';
  return 'unknown';
};

const HealthStatus = ({ data = null, loading = false, error = null, onRefresh }) => {
  const systemStatus = data ? deriveOverallSystemStatus(data.system) : 'unknown';
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Platform Health</h2>
          <p className="text-sm text-slate-400">Live status from the server and downstream services.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="self-start rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 shadow hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
          Failed to load health information: {error.message}
        </div>
      ) : null}
      {data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Overall</span>
              <StatusPill label={data.status.toUpperCase()} status={data.status} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-slate-500">API Status</dt>
                <dd className="mt-1"><StatusPill label={data.api.status.toUpperCase()} status={data.api.status} /></dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Latency</dt>
                <dd className="mt-1 text-slate-200">{formatLatency(data.latencyMs)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Environment</dt>
                <dd className="mt-1 text-slate-200">{data.environment?.name ?? 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Build Timestamp</dt>
                <dd className="mt-1 text-slate-200">{data.environment?.buildTimestamp ?? 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Uptime</dt>
                <dd className="mt-1 text-slate-200">{formatSeconds(data.uptime)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Started</dt>
                <dd className="mt-1 text-slate-200">{new Date(data.startedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Database</span>
              <StatusPill label={data.dependencies.database.status.toUpperCase()} status={data.dependencies.database.status} />
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Connection</span>
                <StatusPill
                  label={data.dependencies.database.connection.status.toUpperCase()}
                  status={data.dependencies.database.connection.status}
                />
              </div>
              {data.dependencies.database.connection.error ? (
                <p className="text-xs text-rose-300">{data.dependencies.database.connection.error}</p>
              ) : null}
              <div className="flex items-center justify-between">
                <span>Query (SELECT 1)</span>
                <StatusPill
                  label={data.dependencies.database.query.status.toUpperCase()}
                  status={data.dependencies.database.query.status}
                />
              </div>
              {data.dependencies.database.query.error ? (
                <p className="text-xs text-rose-300">{data.dependencies.database.query.error}</p>
              ) : null}
              <div>
                <p className="text-xs uppercase text-slate-500">Server Time</p>
                <p className="text-sm text-slate-200">
                  {data.dependencies.database.time.value
                    ? new Date(data.dependencies.database.time.value).toLocaleString()
                    : 'Unavailable'}
                </p>
                {data.dependencies.database.time.error ? (
                  <p className="text-xs text-amber-300">{data.dependencies.database.time.error}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">MinIO Object Storage</span>
              <StatusPill label={data.dependencies.minio.status.toUpperCase()} status={data.dependencies.minio.status} />
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Connection</span>
                <StatusPill
                  label={data.dependencies.minio.connection.status.toUpperCase()}
                  status={data.dependencies.minio.connection.status}
                />
              </div>
              {data.dependencies.minio.connection.error ? (
                <p className="text-xs text-rose-300">{data.dependencies.minio.connection.error}</p>
              ) : null}
              <div className="flex items-center justify-between">
                <span>Bucket</span>
                <StatusPill
                  label={data.dependencies.minio.bucket.status.toUpperCase()}
                  status={data.dependencies.minio.bucket.status}
                />
              </div>
              <p className="text-xs text-slate-400">
                Bucket visibility: {data.dependencies.minio.bucket.exists ? 'reachable' : 'missing'}
              </p>
              {data.dependencies.minio.bucket.error ? (
                <p className="text-xs text-rose-300">{data.dependencies.minio.bucket.error}</p>
              ) : null}
              <div className="flex items-center justify-between">
                <span>CORS</span>
                <StatusPill
                  label={data.dependencies.minio.cors.status.toUpperCase()}
                  status={data.dependencies.minio.cors.status}
                />
              </div>
              {data.dependencies.minio.cors.configured ? (
                <p className="text-xs text-emerald-300">CORS configuration valid</p>
              ) : (
                <p className="text-xs text-amber-300">
                  {data.dependencies.minio.cors.error ?? 'Pending configuration'}
                </p>
              )}
              {data.dependencies.minio.cors.missingOrigins?.length ? (
                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-amber-200">
                  {data.dependencies.minio.cors.missingOrigins.map((origin) => (
                    <li key={origin}>{origin}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Email Server</span>
                <StatusPill label={data.dependencies.email.status.toUpperCase()} status={data.dependencies.email.status} />
              </div>
              {data.dependencies.email.error ? (
                <p className="text-xs text-rose-300">{data.dependencies.email.error}</p>
              ) : (
                <p className="text-xs text-emerald-300">SMTP transport verified</p>
              )}
            </div>

            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">DNS Resolution</span>
                <StatusPill label={data.dependencies.dns.status.toUpperCase()} status={data.dependencies.dns.status} />
              </div>
              <p className="text-xs text-slate-400">
                Host checked: {data.dependencies.dns.host ?? 'Unavailable'}
              </p>
              {data.dependencies.dns.address ? (
                <p className="text-xs text-emerald-300">Resolved to {data.dependencies.dns.address}</p>
              ) : null}
              {data.dependencies.dns.error ? (
                <p className="text-xs text-rose-300">{data.dependencies.dns.error}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">System Metrics</span>
              <StatusPill label={systemStatus.toUpperCase()} status={systemStatus} />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="space-y-1 rounded border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>CPU Usage</span>
                  <StatusPill label={data.system.cpu.status.toUpperCase()} status={data.system.cpu.status} />
                </div>
                <p className="text-xs text-slate-400">
                  Load (1m):
                  {typeof data.system.cpu.load === 'number'
                    ? ` ${data.system.cpu.load.toFixed(2)}`
                    : ' Unknown'}
                </p>
                <p className="text-xs text-slate-400">Cores: {data.system.cpu.cores ?? 'Unknown'}</p>
                <p className="text-xs text-slate-200">Usage: {formatPercent(data.system.cpu.usagePercent)}</p>
              </div>
              <div className="space-y-1 rounded border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Memory Usage</span>
                  <StatusPill label={data.system.memory.status.toUpperCase()} status={data.system.memory.status} />
                </div>
                <p className="text-xs text-slate-400">Total: {formatBytes(data.system.memory.total)}</p>
                <p className="text-xs text-slate-400">Used: {formatBytes(data.system.memory.used)}</p>
                <p className="text-xs text-slate-400">Free: {formatBytes(data.system.memory.free)}</p>
                <p className="text-xs text-slate-200">Usage: {formatPercent(data.system.memory.usagePercent)}</p>
              </div>
              <div className="space-y-1 rounded border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Disk Space</span>
                  <StatusPill label={data.system.disk.status.toUpperCase()} status={data.system.disk.status} />
                </div>
                {data.system.disk.error ? (
                  <p className="text-xs text-rose-300">{data.system.disk.error}</p>
                ) : (
                  <>
                    <p className="text-xs text-slate-400">Mount: {data.system.disk.mount ?? 'Unknown'}</p>
                    <p className="text-xs text-slate-400">Total: {formatBytes(data.system.disk.total)}</p>
                    <p className="text-xs text-slate-400">Used: {formatBytes(data.system.disk.used)}</p>
                    <p className="text-xs text-slate-400">Free: {formatBytes(data.system.disk.free)}</p>
                    <p className="text-xs text-slate-200">Usage: {formatPercent(data.system.disk.usagePercent)}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};


HealthStatus.propTypes = {
  data: PropTypes.shape({
    status: PropTypes.string.isRequired,
    api: PropTypes.shape({
      status: PropTypes.string.isRequired,
    }).isRequired,
    latencyMs: PropTypes.number.isRequired,
    uptime: PropTypes.number.isRequired,
    startedAt: PropTypes.string.isRequired,
    environment: PropTypes.shape({
      name: PropTypes.string,
      buildTimestamp: PropTypes.string,
    }),
    dependencies: PropTypes.shape({
      database: PropTypes.shape({
        status: PropTypes.string.isRequired,
        connection: PropTypes.shape({
          status: PropTypes.string.isRequired,
          error: PropTypes.string,
        }).isRequired,
        query: PropTypes.shape({
          status: PropTypes.string.isRequired,
          error: PropTypes.string,
        }).isRequired,
        time: PropTypes.shape({
          status: PropTypes.string.isRequired,
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
          error: PropTypes.string,
        }).isRequired,
      }).isRequired,
      minio: PropTypes.shape({
        status: PropTypes.string.isRequired,
        connection: PropTypes.shape({
          status: PropTypes.string.isRequired,
          error: PropTypes.string,
        }).isRequired,
        bucket: PropTypes.shape({
          status: PropTypes.string.isRequired,
          exists: PropTypes.bool,
          error: PropTypes.string,
        }).isRequired,
        cors: PropTypes.shape({
          status: PropTypes.string.isRequired,
          configured: PropTypes.bool,
          missingOrigins: PropTypes.arrayOf(PropTypes.string),
          error: PropTypes.string,
        }).isRequired,
      }).isRequired,
      email: PropTypes.shape({
        status: PropTypes.string.isRequired,
        error: PropTypes.string,
      }).isRequired,
      dns: PropTypes.shape({
        status: PropTypes.string.isRequired,
        host: PropTypes.string,
        address: PropTypes.string,
        error: PropTypes.string,
      }).isRequired,
    }).isRequired,
    system: PropTypes.shape({
      cpu: PropTypes.shape({
        status: PropTypes.string.isRequired,
        load: PropTypes.number,
        cores: PropTypes.number,
        usagePercent: PropTypes.number,
      }).isRequired,
      memory: PropTypes.shape({
        status: PropTypes.string.isRequired,
        total: PropTypes.number,
        used: PropTypes.number,
        free: PropTypes.number,
        usagePercent: PropTypes.number,
      }).isRequired,
      disk: PropTypes.shape({
        status: PropTypes.string.isRequired,
        filesystem: PropTypes.string,
        mount: PropTypes.string,
        total: PropTypes.number,
        used: PropTypes.number,
        free: PropTypes.number,
        usagePercent: PropTypes.number,
        error: PropTypes.string,
      }).isRequired,
    }).isRequired,
  }),
  loading: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
  onRefresh: PropTypes.func.isRequired,
};

export default HealthStatus;
