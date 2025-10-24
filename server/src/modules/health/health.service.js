const path = require('path');
const prisma = require('../../integrations/prisma');
const config = require('../../config');
const { checkBucket, getCorsRules } = require('../../integrations/minioClient');
const { getUptimeSeconds, startedAt } = require('../../utils/runtimeInfo');
const { createIntegrationError } = require(path.resolve(
  __dirname,
  '../../../..',
  'shared',
  'error-handling'
));

const fetchDatabaseTimestamp = async () => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()::timestamptz AS current_time`;
    const row = Array.isArray(result) ? result[0] : result;
    return row?.current_time ?? null;
  } catch (error) {
    throw createIntegrationError('Database connectivity check failed', {
      cause: error.message,
    });
  }
};

const evaluateMinio = async () => {
  const summary = {
    status: 'unknown',
    bucketExists: false,
    cors: {
      configured: false,
      missingOrigins: [],
      rules: [],
    },
  };

  try {
    await checkBucket();
    summary.status = 'ok';
    summary.bucketExists = true;
  } catch (error) {
    summary.status = 'error';
    summary.error = error.message;
    return summary;
  }

  try {
    const corsRules = await getCorsRules();
    summary.cors.rules = corsRules;

    const configuredOrigins = corsRules.flatMap((rule) => rule.AllowedOrigins ?? []);
    const expectedOrigins = config.minio.allowedOrigins;

    if (!corsRules.length && expectedOrigins.length === 0) {
      summary.cors.configured = true;
      summary.cors.error = null;
      return summary;
    }

    if (!corsRules.length) {
      summary.cors.error = 'No CORS rules configured';
      summary.status = 'degraded';
      return summary;
    }

    const missingOrigins = expectedOrigins.filter((origin) => !configuredOrigins.includes(origin));

    summary.cors.missingOrigins = missingOrigins;
    summary.cors.configured = missingOrigins.length === 0;

    if (missingOrigins.length) {
      summary.status = 'degraded';
      summary.cors.error = 'Missing expected CORS origins';
    }
  } catch (error) {
    summary.status = 'degraded';
    summary.cors.error = error.message;
  }

  return summary;
};

const getHealthStatus = async () => {
  let database;
  try {
    const timestamp = await fetchDatabaseTimestamp();
    database = {
      status: 'ok',
      timestamp,
    };
  } catch (error) {
    database = {
      status: 'error',
      timestamp: null,
      error: error.message,
    };
  }

  const minioStatus = await evaluateMinio();

  const allHealthy =
    database.status === 'ok' && minioStatus.status !== 'error' && minioStatus.cors.configured !== false;

  return {
    status: allHealthy ? 'ok' : 'degraded',
    uptime: getUptimeSeconds(),
    startedAt,
    dependencies: {
      database,
      minio: minioStatus,
    },
  };
};

module.exports = {
  getHealthStatus,
};
