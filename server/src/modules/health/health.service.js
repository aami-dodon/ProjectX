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

const checkMinioCors = async () => {
  try {
    const policy = await minioClient.getBucketPolicy(env.MINIO_BUCKET).catch((error) => {
      if (error?.code === 'NoSuchBucketPolicy') {
        return null;
      }
      throw error;
    });

    if (!policy) {
      return {
        ok: false,
        message: 'No bucket policy found to validate CORS configuration',
      };
    }

    const allowedOrigins = env.MINIO_CORS_ALLOWED_ORIGINS;
    const missingOrigins = allowedOrigins.filter((origin) => !policy.includes(origin));

    if (missingOrigins.length > 0) {
      return {
        ok: false,
        message: `Missing expected origins in bucket policy: ${missingOrigins.join(', ')}`,
      };
    }

    return {
      ok: true,
      message: 'Bucket policy includes expected CORS origins',
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to inspect MinIO bucket policy');
    return {
      ok: false,
      message: `Unable to verify CORS configuration: ${error.message}`,
    };
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
      cors: {
        ok: false,
        message: null,
      },
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
    const corsResult = await checkMinioCors();
    response.minio.status = corsResult.ok ? 'ok' : 'warning';
    response.minio.cors = corsResult;
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
