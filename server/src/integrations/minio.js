const Minio = require('minio');

const { env } = require('@/config/env');
const { ApplicationError, createIntegrationError } = require('@/utils/errors');
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

async function verifyBucket(bucketName = env.MINIO_BUCKET) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      throw createIntegrationError(`Bucket ${bucketName} does not exist`);
    }

    return true;
  } catch (error) {
    logger.error('Failed to verify MinIO bucket', {
      bucket: bucketName,
      error: error.message,
    });

    if (error instanceof ApplicationError) {
      throw error;
    }

    throw createIntegrationError('Failed to verify MinIO bucket', { bucket: bucketName });
  }
}

async function getPresignedUploadUrl(bucket, objectName, expiry = 600) {
  const targetBucket = bucket ?? env.MINIO_BUCKET;

  await verifyBucket(targetBucket);

  try {
    return await minioClient.presignedPutObject(targetBucket, objectName, expiry);
  } catch (error) {
    logger.error('Failed to generate MinIO upload URL', {
      bucket: targetBucket,
      objectName,
      error: error.message,
    });

    throw createIntegrationError('Failed to generate MinIO upload URL');
  }
}

async function getPresignedDownloadUrl(bucket, objectName, expiry = 300) {
  const targetBucket = bucket ?? env.MINIO_BUCKET;

  await verifyBucket(targetBucket);

  try {
    return await minioClient.presignedGetObject(targetBucket, objectName, expiry);
  } catch (error) {
    logger.error('Failed to generate MinIO download URL', {
      bucket: targetBucket,
      objectName,
      error: error.message,
    });

    throw createIntegrationError('Failed to generate MinIO download URL');
  }
}

module.exports = {
  minioClient,
  verifyBucket,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
};
