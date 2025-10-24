const { prisma } = require('../../integrations/prisma');
const { minioClient } = require('../../integrations/minio');
const { env } = require('../../config/env');
const { createLogger } = require('../../utils/logger');
const { createIntegrationError, ApplicationError } = require('../../../../shared/error-handling');

const logger = createLogger('health-service');

const getDbTimestamp = async () => {
  try {
    const [result] = await prisma.$queryRaw`SELECT NOW() AS now`;
    return result?.now;
  } catch (error) {
    logger.error({ error: error.message }, 'Database health check failed');
    throw createIntegrationError('Database connectivity failed', { cause: error.message });
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

    return true;
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }
    logger.error({ error: error.message }, 'MinIO bucket health check failed');
    throw createIntegrationError('MinIO bucket verification failed', { cause: error.message });
  }
};

const buildHealthResponse = async (app) => {
  const uptimeMs = Date.now() - (app.locals.serverStartTime ?? Date.now());
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  const response = {
    status: 'ok',
    uptime: {
      seconds: uptimeSeconds,
      humanized: `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`,
    },
    timestamp: new Date().toISOString(),
    database: {
      status: 'unknown',
      timestamp: null,
    },
    minio: {
      status: 'unknown',
      bucket: env.MINIO_BUCKET,
    },
  };

  try {
    const dbTimestamp = await getDbTimestamp();
    response.database.status = 'ok';
    response.database.timestamp = dbTimestamp instanceof Date ? dbTimestamp.toISOString() : dbTimestamp;
  } catch (error) {
    response.status = 'degraded';
    response.database.status = 'error';
    response.database.error = error.message;
  }

  try {
    await checkMinioBucket();
    response.minio.status = 'ok';
  } catch (error) {
    response.status = 'degraded';
    response.minio.status = 'error';
    response.minio.error = error.message;
  }

  return response;
};

module.exports = {
  buildHealthResponse,
};
