const os = require('os');
const dns = require('dns').promises;
const { performance } = require('perf_hooks');
const { execFile } = require('child_process');
const util = require('util');

const prisma = require('../../integrations/prisma');
const config = require('../../config');
const { checkConnection, checkBucket, getCorsRules } = require('../../integrations/minioClient');
const { transporter } = require('../../integrations/mailer');
const { getUptimeSeconds, startedAt } = require('../../utils/runtimeInfo');
const { requireShared } = require('../../utils/sharedModule');

const execFileAsync = util.promisify(execFile);
const { createIntegrationError } = requireShared('error-handling');

const deriveStatus = (items) => {
  const normalized = items.filter(Boolean).map((item) => item.status ?? item);
  if (!normalized.length) return 'unknown';
  if (normalized.some((status) => status === 'error')) return 'error';
  if (normalized.some((status) => status === 'degraded')) return 'degraded';
  if (normalized.every((status) => status === 'ok')) return 'ok';
  return 'unknown';
};

const checkDatabase = async () => {
  const database = {
    status: 'unknown',
    connection: { status: 'unknown' },
    query: { status: 'unknown' },
    time: { status: 'unknown', value: null },
  };

  try {
    await prisma.$queryRaw`SELECT 1;`;
    database.connection.status = 'ok';
    database.query.status = 'ok';
  } catch (error) {
    const wrapped = createIntegrationError('Database connectivity check failed', {
      cause: error.message,
    });
    database.connection = { status: 'error', error: wrapped.message };
    database.query = { status: 'error', error: wrapped.message };
    database.status = deriveStatus([database.connection, database.query]);
    return database;
  }

  try {
    const result = await prisma.$queryRaw`SELECT NOW()::timestamptz AS current_time`;
    const row = Array.isArray(result) ? result[0] : result;
    if (row?.current_time) {
      database.time = { status: 'ok', value: row.current_time };
    } else {
      database.time = {
        status: 'degraded',
        value: null,
        error: 'Database returned no timestamp',
      };
    }
  } catch (error) {
    database.time = {
      status: 'degraded',
      value: null,
      error: error.message,
    };
  }

  database.status = deriveStatus([database.connection, database.query, database.time]);
  return database;
};

const evaluateMinio = async () => {
  const summary = {
    status: 'unknown',
    connection: { status: 'unknown' },
    bucket: { status: 'unknown', exists: false },
    cors: {
      status: 'unknown',
      configured: false,
      missingOrigins: [],
      rules: [],
    },
  };

  try {
    await checkConnection();
    summary.connection.status = 'ok';
  } catch (error) {
    summary.connection = { status: 'error', error: error.message };
    summary.status = deriveStatus([summary.connection]);
    return summary;
  }

  try {
    await checkBucket();
    summary.bucket = { status: 'ok', exists: true };
  } catch (error) {
    summary.bucket = { status: 'error', exists: false, error: error.message };
    summary.status = deriveStatus([summary.connection, summary.bucket]);
    return summary;
  }

  try {
    const corsRules = await getCorsRules();
    summary.cors.rules = corsRules;

    const configuredOrigins = corsRules.flatMap((rule) => rule.AllowedOrigins ?? []);
    const expectedOrigins = config.minio.allowedOrigins;

    if (!corsRules.length && expectedOrigins.length === 0) {
      summary.cors = {
        ...summary.cors,
        status: 'ok',
        configured: true,
        error: null,
      };
    } else if (!corsRules.length) {
      summary.cors = {
        ...summary.cors,
        status: 'degraded',
        error: 'No CORS rules configured',
      };
    } else {
      const missingOrigins = expectedOrigins.filter((origin) => !configuredOrigins.includes(origin));
      summary.cors.missingOrigins = missingOrigins;
      summary.cors.configured = missingOrigins.length === 0;
      summary.cors.status = missingOrigins.length ? 'degraded' : 'ok';
      if (missingOrigins.length) {
        summary.cors.error = 'Missing expected CORS origins';
      }
    }
  } catch (error) {
    summary.cors = {
      ...summary.cors,
      status: 'degraded',
      error: error.message,
    };
  }

  summary.status = deriveStatus([summary.connection, summary.bucket, summary.cors]);
  return summary;
};

const checkEmail = async () => {
  try {
    await transporter.verify();
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
};

const resolveDns = async () => {
  const target = config.minio.endpoint?.split(':')[0];
  if (!target) {
    return {
      status: 'unknown',
      error: 'No MinIO endpoint configured for DNS check',
    };
  }

  try {
    const result = await dns.lookup(target);
    return {
      status: 'ok',
      host: target,
      address: result.address,
      family: result.family,
    };
  } catch (error) {
    return {
      status: 'error',
      host: target,
      error: error.message,
    };
  }
};

const evaluateCpu = () => {
  const load = os.loadavg()[0] ?? 0;
  const cores = os.cpus()?.length ?? 1;
  const usagePercent = Math.max(0, Math.min(100, (load / cores) * 100));
  const status = usagePercent > 90 ? 'degraded' : 'ok';
  return {
    status,
    load,
    cores,
    usagePercent,
  };
};

const evaluateMemory = () => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usagePercent = total > 0 ? (used / total) * 100 : 0;
  const status = usagePercent > 90 ? 'degraded' : 'ok';
  return {
    status,
    total,
    used,
    free,
    usagePercent,
  };
};

const evaluateDisk = async () => {
  try {
    const { stdout } = await execFileAsync('df', ['-k', process.cwd()]);
    const lines = stdout.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Unexpected disk information response');
    }

    const parts = lines[1].split(/\s+/);
    const total = Number(parts[1]) * 1024;
    const used = Number(parts[2]) * 1024;
    const free = Number(parts[3]) * 1024;
    const usagePercent = Number(parts[4]?.replace('%', ''));
    const status = usagePercent > 90 ? 'degraded' : 'ok';

    return {
      status,
      filesystem: parts[0],
      mount: parts[5],
      total,
      used,
      free,
      usagePercent,
    };
  } catch (error) {
    return {
      status: 'degraded',
      error: error.message,
    };
  }
};

const getHealthStatus = async () => {
  const start = performance.now();

  const [database, minio, email, dnsResolution, disk] = await Promise.all([
    checkDatabase(),
    evaluateMinio(),
    checkEmail(),
    resolveDns(),
    evaluateDisk(),
  ]);

  const cpu = evaluateCpu();
  const memory = evaluateMemory();

  const latencyMs = performance.now() - start;

  const overallStatus = deriveStatus([
    database.status,
    minio.status,
    email.status,
    dnsResolution.status,
    cpu.status,
    memory.status,
    disk.status,
  ]);

  return {
    status: overallStatus,
    api: {
      status: 'ok',
    },
    latencyMs,
    uptime: getUptimeSeconds(),
    startedAt,
    environment: {
      name: config.meta.environment,
      buildTimestamp: config.meta.buildTimestamp,
    },
    dependencies: {
      database,
      minio,
      email,
      dns: dnsResolution,
    },
    system: {
      cpu,
      memory,
      disk,
    },
  };
};

module.exports = {
  getHealthStatus,
};
