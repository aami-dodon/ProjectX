const Minio = require('minio');
const { Readable } = require('node:stream');

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

const verifyBucket = async (bucketName = env.MINIO_BUCKET) => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      throw new Error(`Bucket ${bucketName} does not exist`);
    }
    return true;
  } catch (error) {
    logger.error('Failed to verify bucket existence', {
      bucket: bucketName,
      error: error.message,
    });
    throw error;
  }
};

const ensureBucketExists = async (bucketName = env.MINIO_BUCKET, region = env.MINIO_REGION) => {
  try {
    const exists = await minioClient.bucketExists(bucketName);

    if (!exists) {
      await minioClient.makeBucket(bucketName, region);
      logger.info('Created missing MinIO bucket', { bucket: bucketName, region });
    }

    return true;
  } catch (error) {
    logger.error('Failed to ensure bucket existence', {
      bucket: bucketName,
      region,
      error: error.message,
    });
    throw error;
  }
};

const isReadableStream = (value) => Boolean(value && typeof value.pipe === 'function');

const normalizeBodyInput = (body) => {
  if (Buffer.isBuffer(body)) {
    return { data: body, size: body.length };
  }

  if (typeof body === 'string') {
    const buffer = Buffer.from(body);
    return { data: buffer, size: buffer.length };
  }

  if (body instanceof Readable || isReadableStream(body)) {
    return { data: body };
  }

  throw new Error('MinIO upload body must be a Buffer, string, or readable stream');
};

const uploadObject = async ({
  bucket = env.MINIO_BUCKET,
  objectName,
  body,
  size,
  contentType,
  metadata = {},
  ensureBucket = false,
} = {}) => {
  if (!objectName || typeof objectName !== 'string') {
    throw new Error('objectName must be provided when uploading to MinIO');
  }

  if (!body) {
    throw new Error('body must be provided when uploading to MinIO');
  }

  if (ensureBucket) {
    await ensureBucketExists(bucket);
  } else {
    await verifyBucket(bucket);
  }

  const normalized = normalizeBodyInput(body);
  const uploadSize = typeof size === 'number' ? size : normalized.size;

  if (normalized.data instanceof Readable && (typeof uploadSize !== 'number' || Number.isNaN(uploadSize))) {
    throw new Error('size must be provided when uploading a stream to MinIO');
  }

  const metaData = { ...metadata };
  if (contentType && !metaData['Content-Type']) {
    metaData['Content-Type'] = contentType;
  }

  try {
    await minioClient.putObject(bucket, objectName, normalized.data, uploadSize, metaData);
    logger.info('Uploaded object to MinIO', {
      bucket,
      objectName,
      size: uploadSize,
    });

    return {
      bucket,
      objectName,
      size: uploadSize,
      metadata: metaData,
    };
  } catch (error) {
    logger.error('Failed to upload object to MinIO', {
      bucket,
      objectName,
      error: error.message,
    });
    throw error;
  }
};

module.exports = {
  minioClient,
  verifyBucket,
  ensureBucketExists,
  uploadObject,
};
