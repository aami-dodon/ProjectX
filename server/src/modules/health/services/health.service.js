const os = require('node:os');
const { execSync } = require('node:child_process');

const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');
const { checkDatabaseConnection } = require('@/modules/health/repositories/health.repository');

const logger = createLogger('health-service');

const determineOverallStatus = (statuses) => {
  if (statuses.some((status) => status === 'outage')) {
    return 'outage';
  }

  if (statuses.some((status) => status === 'degraded')) {
    return 'degraded';
  }

  return 'operational';
};

const formatPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  const clamped = Math.max(0, Math.min(value, 100));
  return Math.round(clamped * 10) / 10;
};

const toFiniteOrNull = (value) => (Number.isFinite(value) ? value : null);

const getCpuSnapshot = () => {
  const cpus = os.cpus();
  const cores = Array.isArray(cpus) ? cpus.length : 0;
  const [oneMinute, fiveMinute, fifteenMinute] = os.loadavg();

  const utilizationPercent = cores ? formatPercentage((oneMinute / cores) * 100) : null;

  return {
    cores,
    loadAverages: {
      oneMinute: Number.isFinite(oneMinute) ? Math.round(oneMinute * 100) / 100 : null,
      fiveMinute: Number.isFinite(fiveMinute) ? Math.round(fiveMinute * 100) / 100 : null,
      fifteenMinute: Number.isFinite(fifteenMinute) ? Math.round(fifteenMinute * 100) / 100 : null,
    },
    utilizationPercent,
  };
};

const getMemorySnapshot = () => {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = Math.max(totalBytes - freeBytes, 0);
  const utilizationPercent = totalBytes
    ? formatPercentage((usedBytes / totalBytes) * 100)
    : null;

  return {
    totalBytes,
    freeBytes,
    usedBytes,
    utilizationPercent,
  };
};

const getDiskSnapshot = () => {
  try {
    const output = execSync('df -Pk /', { encoding: 'utf8' });
    const [, line] = output.trim().split('\n');

    if (!line) {
      return {
        totalBytes: null,
        freeBytes: null,
        usedBytes: null,
        utilizationPercent: null,
      };
    }

    const parts = line.trim().split(/\s+/);

    if (parts.length < 5) {
      return {
        totalBytes: null,
        freeBytes: null,
        usedBytes: null,
        utilizationPercent: null,
      };
    }

    const totalBytes = Number.parseInt(parts[1], 10) * 1024;
    const usedBytes = Number.parseInt(parts[2], 10) * 1024;
    const freeBytes = Number.parseInt(parts[3], 10) * 1024;
    const utilizationPercent = formatPercentage(Number(parts[4]?.replace('%', '')));

    return {
      totalBytes: Number.isFinite(totalBytes) ? totalBytes : null,
      freeBytes: Number.isFinite(freeBytes) ? freeBytes : null,
      usedBytes: Number.isFinite(usedBytes) ? usedBytes : null,
      utilizationPercent,
    };
  } catch (error) {
    logger.warn({ error: error.message }, 'Failed to collect disk usage metrics');
    return {
      totalBytes: null,
      freeBytes: null,
      usedBytes: null,
      utilizationPercent: null,
    };
  }
};

const getProcessSnapshot = ({ uptimeSeconds, cores }) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  const totalCpuSeconds = toFiniteOrNull((cpuUsage.user + cpuUsage.system) / 1_000_000);
  const averageUtilizationPercent =
    Number.isFinite(totalCpuSeconds) && uptimeSeconds > 0 && cores > 0
      ? formatPercentage((totalCpuSeconds / (uptimeSeconds * cores)) * 100)
      : null;

  return {
    pid: process.pid,
    cpu: {
      averageUtilizationPercent,
      totalCpuSeconds: Number.isFinite(totalCpuSeconds)
        ? Math.round(totalCpuSeconds * 100) / 100
        : null,
      userMicros: toFiniteOrNull(cpuUsage.user),
      systemMicros: toFiniteOrNull(cpuUsage.system),
    },
    memory: {
      rssBytes: toFiniteOrNull(memoryUsage.rss),
      heapTotalBytes: toFiniteOrNull(memoryUsage.heapTotal),
      heapUsedBytes: toFiniteOrNull(memoryUsage.heapUsed),
      externalBytes: toFiniteOrNull(memoryUsage.external),
      arrayBuffersBytes: toFiniteOrNull(memoryUsage.arrayBuffers),
    },
  };
};

const evaluateCorsConfiguration = (corsOptions = {}) => {
  const allowedOrigins = Array.isArray(corsOptions.origin)
    ? corsOptions.origin
    : env.CORS_ALLOWED_ORIGINS;
  const allowsCredentials = Boolean(corsOptions.credentials);
  const allowedHeaders = Array.isArray(corsOptions.allowedHeaders)
    ? corsOptions.allowedHeaders
    : ['Authorization', 'Content-Type', 'X-Request-ID'];

  const issues = [];
  const missingOrigins = env.CORS_ALLOWED_ORIGINS.filter((origin) => !allowedOrigins.includes(origin));

  if (missingOrigins.length) {
    issues.push(`Missing required origins: ${missingOrigins.join(', ')}`);
  }

  if (!allowsCredentials) {
    issues.push('CORS credentials support is disabled');
  }

  const status = issues.length ? 'degraded' : 'operational';

  return {
    status,
    allowedOrigins,
    allowsCredentials,
    allowedHeaders,
    issues,
  };
};

const getHealthStatus = async ({ serverStartTime, corsOptions }) => {
  const now = Date.now();
  const uptimeSeconds = Math.round(process.uptime());
  const startedAt = serverStartTime ? new Date(serverStartTime).toISOString() : null;

  const cpu = getCpuSnapshot();
  const memory = getMemorySnapshot();
  const disk = getDiskSnapshot();
  const processSnapshot = getProcessSnapshot({ uptimeSeconds, cores: cpu.cores });

  const system = {
    status: 'operational',
    uptimeSeconds,
    startedAt,
    nodeVersion: process.version,
    environment: env.NODE_ENV,
    cpu,
    memory,
    disk,
    process: processSnapshot,
    metrics: {
      backend: {
        host: {
          cpu,
          memory,
          disk,
        },
        process: processSnapshot,
      },
    },
  };

  let database = {
    status: 'operational',
    latencyMs: null,
    error: null,
  };
  let apiStatus = 'operational';

  try {
    const result = await checkDatabaseConnection();
    database = {
      ...database,
      ...result,
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Database health check failed');
    database = {
      status: 'outage',
      latencyMs: null,
      error: error.message,
    };
    apiStatus = 'degraded';
  }

  const cors = evaluateCorsConfiguration(corsOptions);
  const componentStatuses = [system.status, apiStatus, cors.status, database.status];
  const overallStatus = determineOverallStatus(componentStatuses);

  const api = {
    status: apiStatus === 'degraded' && database.status === 'outage' ? 'outage' : apiStatus,
    checkedAt: new Date(now).toISOString(),
    database: {
      ...database,
      provider: (() => {
        const providerSegment = env.DATABASE_URL.split('://')[0] ?? '';
        const normalized = providerSegment.split('+')[0]?.toLowerCase();
        if (normalized === 'postgresql') {
          return 'PostgreSQL';
        }
        if (normalized) {
          return normalized.charAt(0).toUpperCase() + normalized.slice(1);
        }
        return 'Database';
      })(),
    },
  };

  return {
    status: overallStatus,
    system,
    api,
    cors,
    checkedAt: new Date(now).toISOString(),
  };
};

module.exports = {
  getHealthStatus,
};
