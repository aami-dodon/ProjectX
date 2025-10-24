const os = require('os');
const dns = require('dns').promises;
const fs = require('fs/promises');
const { performance } = require('perf_hooks');

const { prisma } = require('../../integrations/prisma');
const { minioClient } = require('../../integrations/minio');
const { verifyTransporter } = require('../../integrations/mailer');
const { env } = require('../../config/env');
const { createLogger } = require('../../utils/logger');
const { createIntegrationError, ApplicationError } = require('../../../../shared/error-handling');

const logger = createLogger('health-service');

const markDegraded = (response) => {
  if (response.status === 'ok') {
    response.status = 'degraded';
  }
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(2)} ${units[index]}`;
};

const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    return { status: 'ok' };
  } catch (error) {
    logger.error({ error: error.message }, 'Database connection check failed');
    throw createIntegrationError('Database connectivity failed', { cause: error.message });
  }
};

const checkDatabaseQuery = async () => {
  try {
    const [result] = await prisma.$queryRaw`SELECT 1 AS result`;
    const isValid = result?.result === 1 || result?.result === '1';

    if (!isValid) {
      throw new Error('Unexpected database response to SELECT 1');
    }

    return { status: 'ok', result: 1 };
  } catch (error) {
    logger.error({ error: error.message }, 'Database query check failed');
    throw createIntegrationError('Database query failed', { cause: error.message });
  }
};

const checkMinioConnection = async () => {
  try {
    await minioClient.listBuckets();
    return { status: 'ok' };
  } catch (error) {
    logger.error({ error: error.message }, 'MinIO connection check failed');
    throw createIntegrationError('MinIO connectivity failed', { cause: error.message });
  }
};

const checkMinioBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(env.MINIO_BUCKET);
    if (!exists) {
      throw new ApplicationError('MinIO bucket does not exist', {
        status: 500,
        code: 'MINIO_BUCKET_MISSING',
      });
    }

    return { status: 'ok' };
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }
    logger.error({ error: error.message }, 'MinIO bucket health check failed');
    throw createIntegrationError('MinIO bucket verification failed', { cause: error.message });
  }
};

const checkMinioCors = async () => {
  try {
    const policy = await minioClient.getBucketPolicy(env.MINIO_BUCKET);
    return { status: 'ok', policy };
  } catch (error) {
    logger.error({ error: error.message }, 'MinIO CORS policy check failed');
    throw createIntegrationError('Failed to read MinIO bucket policy', { cause: error.message });
  }
};

const checkEmailServer = async () => {
  try {
    await verifyTransporter();
    return { status: 'ok' };
  } catch (error) {
    logger.error({ error: error.message }, 'Email server check failed');
    throw createIntegrationError('Email server verification failed', { cause: error.message });
  }
};

const checkDnsResolution = async () => {
  const records = [];
  const targets = [];

  try {
    targets.push({ name: 'database', host: new URL(env.DATABASE_URL).hostname });
  } catch (error) {
    logger.warn({ error: error.message }, 'Failed to parse database URL for DNS check');
  }

  targets.push({ name: 'minio', host: env.MINIO_ENDPOINT });
  targets.push({ name: 'email', host: env.EMAIL_SMTP_HOST });

  try {
    for (const target of targets) {
      if (!target.host) continue;
      try {
        const result = await dns.lookup(target.host);
        records.push({ ...target, address: result.address, family: result.family });
      } catch (error) {
        records.push({ ...target, error: error.message });
        throw error;
      }
    }

    return { status: 'ok', records };
  } catch (error) {
    logger.error({ error: error.message }, 'DNS resolution check failed');
    throw createIntegrationError('DNS resolution failed', { cause: error.message, records });
  }
};

const collectSystemMetrics = async () => {
  try {
    const loadAverage = os.loadavg();
    const cores = os.cpus().length || 1;
    const cpuUtilization = Number(((loadAverage[0] / cores) * 100).toFixed(2));

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUtilization = Number(((usedMemory / totalMemory) * 100).toFixed(2));

    let stat = null;
    if (typeof fs.statfs === 'function') {
      stat = await fs.statfs('/');
    }
    let disk;

    if (stat && stat.bsize && stat.blocks) {
      const total = stat.bsize * stat.blocks;
      const available = stat.bsize * (stat.bavail ?? stat.bfree ?? 0);
      const used = total - available;
      const usage = total > 0 ? Number(((used / total) * 100).toFixed(2)) : 0;

      disk = {
        total,
        used,
        available,
        usage,
        totalHuman: formatBytes(total),
        usedHuman: formatBytes(used),
        availableHuman: formatBytes(available),
      };
    }

    return {
      status: 'ok',
      cpu: {
        cores,
        loadAverage: loadAverage.map((value) => Number(value.toFixed(2))),
        utilization: cpuUtilization,
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        utilization: memoryUtilization,
        totalHuman: formatBytes(totalMemory),
        usedHuman: formatBytes(usedMemory),
        freeHuman: formatBytes(freeMemory),
      },
      disk,
    };
  } catch (error) {
    logger.error({ error: error.message }, 'System metrics collection failed');
    throw createIntegrationError('Failed to collect system metrics', { cause: error.message });
  }
};

const buildHealthResponse = async (app) => {
  const start = performance.now();
  const uptimeMs = Date.now() - (app.locals.serverStartTime ?? Date.now());
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  const response = {
    status: 'ok',
    latencyMs: null,
    timestamp: new Date().toISOString(),
    environment: {
      name: env.NODE_ENV,
      buildTimestamp: process.env.BUILD_TIMESTAMP ?? null,
    },
    uptime: {
      seconds: uptimeSeconds,
      humanized: `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`,
    },
    api: {
      status: 'ok',
      message: 'API is responding',
    },
    database: {
      status: 'unknown',
      connection: { status: 'unknown' },
      query: { status: 'unknown' },
    },
    minio: {
      status: 'unknown',
      bucket: env.MINIO_BUCKET,
      connection: { status: 'unknown' },
      bucketCheck: { status: 'unknown' },
      cors: { status: 'unknown' },
    },
    email: {
      status: 'unknown',
    },
    dns: {
      status: 'unknown',
      records: [],
    },
    cors: {
      status: env.CORS_ALLOWED_ORIGINS.length ? 'ok' : 'error',
      allowedOrigins: env.CORS_ALLOWED_ORIGINS,
    },
    system: {
      status: 'unknown',
    },
  };

  try {
    const connection = await checkDatabaseConnection();
    response.database.connection = connection;
  } catch (error) {
    markDegraded(response);
    response.database.status = 'error';
    response.database.connection = { status: 'error', error: error.message };
  }

  try {
    const query = await checkDatabaseQuery();
    response.database.query = query;
    if (response.database.status !== 'error') {
      response.database.status = 'ok';
    }
  } catch (error) {
    markDegraded(response);
    response.database.status = 'error';
    response.database.query = { status: 'error', error: error.message };
  }

  try {
    const connection = await checkMinioConnection();
    response.minio.connection = connection;
  } catch (error) {
    markDegraded(response);
    response.minio.status = 'error';
    response.minio.connection = { status: 'error', error: error.message };
  }

  try {
    const bucketCheck = await checkMinioBucket();
    response.minio.bucketCheck = bucketCheck;
  } catch (error) {
    markDegraded(response);
    response.minio.status = 'error';
    response.minio.bucketCheck = { status: 'error', error: error.message };
  }

  try {
    const cors = await checkMinioCors();
    response.minio.cors = cors;
  } catch (error) {
    markDegraded(response);
    response.minio.status = 'error';
    response.minio.cors = { status: 'error', error: error.message };
  }

  if (
    response.minio.connection.status !== 'error' &&
    response.minio.bucketCheck.status !== 'error' &&
    response.minio.cors.status !== 'error'
  ) {
    response.minio.status = 'ok';
  }

  try {
    const emailStatus = await checkEmailServer();
    response.email = { ...response.email, ...emailStatus };
  } catch (error) {
    markDegraded(response);
    response.email = { status: 'error', error: error.message };
  }

  try {
    const dnsStatus = await checkDnsResolution();
    response.dns = dnsStatus;
  } catch (error) {
    markDegraded(response);
    response.dns = { status: 'error', error: error.message, records: error.details?.records ?? [] };
  }

  try {
    const systemMetrics = await collectSystemMetrics();
    response.system = systemMetrics;
  } catch (error) {
    markDegraded(response);
    response.system = { status: 'error', error: error.message };
  }

  response.latencyMs = Number((performance.now() - start).toFixed(2));

  if (response.cors.status === 'error') {
    markDegraded(response);
  }

  return response;
};

module.exports = {
  buildHealthResponse,
};
