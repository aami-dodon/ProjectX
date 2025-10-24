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

const HealthStatus = ({ data, loading, error, onRefresh }) => {
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Platform Health</h2>
          <p className="text-sm text-slate-400">Live status from the server and downstream services.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 shadow hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Overall</span>
              <StatusPill label={data.status.toUpperCase()} status={data.status} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Uptime</p>
              <p className="text-base font-medium text-slate-100">{formatSeconds(data.uptime)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Started At</p>
              <p className="text-sm text-slate-200">{new Date(data.startedAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Database</span>
              <StatusPill label={data.dependencies.database.status.toUpperCase()} status={data.dependencies.database.status} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Current Time</p>
              <p className="text-sm text-slate-200">
                {data.dependencies.database.timestamp
                  ? new Date(data.dependencies.database.timestamp).toLocaleString()
                  : 'Unavailable'}
              </p>
              {data.dependencies.database.error ? (
                <p className="mt-1 text-xs text-rose-300">{data.dependencies.database.error}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Object Storage</span>
              <StatusPill label={data.dependencies.minio.status.toUpperCase()} status={data.dependencies.minio.status} />
            </div>
            <div className="text-xs text-slate-400">
              <p>Bucket: {data.dependencies.minio.bucketExists ? 'reachable' : 'missing'}</p>
              {data.dependencies.minio.error ? (
                <p className="mt-1 text-rose-300">{data.dependencies.minio.error}</p>
              ) : null}
              {data.dependencies.minio.cors?.configured ? (
                <p className="mt-1 text-emerald-300">CORS configuration valid</p>
              ) : (
                <p className="mt-1 text-amber-300">
                  CORS check: {data.dependencies.minio.cors?.error ?? 'pending configuration'}
                </p>
              )}
              {data.dependencies.minio.cors?.missingOrigins?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-200">
                  {data.dependencies.minio.cors.missingOrigins.map((origin) => (
                    <li key={origin}>{origin}</li>
                  ))}
                </ul>
              ) : null}
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
    uptime: PropTypes.number.isRequired,
    startedAt: PropTypes.string.isRequired,
    dependencies: PropTypes.shape({
      database: PropTypes.shape({
        status: PropTypes.string.isRequired,
        timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      }).isRequired,
      minio: PropTypes.shape({
        status: PropTypes.string.isRequired,
        bucketExists: PropTypes.bool,
        cors: PropTypes.shape({
          configured: PropTypes.bool,
          missingOrigins: PropTypes.arrayOf(PropTypes.string),
          error: PropTypes.string,
        }),
      }).isRequired,
    }).isRequired,
  }),
  loading: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string }),
  onRefresh: PropTypes.func.isRequired,
};

HealthStatus.defaultProps = {
  data: null,
  loading: false,
  error: null,
};

export default HealthStatus;
