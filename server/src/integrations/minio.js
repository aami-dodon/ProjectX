const Minio = require('minio');
const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('minio');

const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
  region: env.MINIO_REGION,
});

const verifyBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(env.MINIO_BUCKET);
    if (!exists) {
      throw new Error(`Bucket ${env.MINIO_BUCKET} does not exist`);
    }
    return true;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to verify bucket existence');
    throw error;
  }
};

module.exports = {
  minioClient,
  verifyBucket,
};
