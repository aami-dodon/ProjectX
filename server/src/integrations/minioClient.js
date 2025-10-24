const {
  S3Client,
  HeadBucketCommand,
  GetBucketCorsCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../config');
const { requireShared } = require('../utils/sharedModule');

const { createIntegrationError } = requireShared('error-handling');

const buildEndpoint = () => {
  const protocol = config.minio.useSSL ? 'https' : 'http';
  const base = `${protocol}://${config.minio.endpoint}`;
  return config.minio.port ? `${base}:${config.minio.port}` : base;
};

const client = new S3Client({
  forcePathStyle: true,
  region: config.minio.region,
  endpoint: buildEndpoint(),
  credentials: {
    accessKeyId: config.minio.accessKey,
    secretAccessKey: config.minio.secretKey,
  },
});

const ensureConfiguration = () => {
  if (!config.minio.endpoint) {
    throw createIntegrationError('MinIO endpoint is not configured');
  }
  if (!config.minio.bucket) {
    throw createIntegrationError('MinIO bucket is not configured');
  }
  if (!config.minio.accessKey || !config.minio.secretKey) {
    throw createIntegrationError('MinIO credentials are not configured');
  }
};

const checkBucket = async () => {
  ensureConfiguration();
  await client.send(new HeadBucketCommand({ Bucket: config.minio.bucket }));
};

const checkConnection = async () => {
  ensureConfiguration();
  await client.send(new ListBucketsCommand({}));
};

const getCorsRules = async () => {
  ensureConfiguration();
  try {
    const response = await client.send(
      new GetBucketCorsCommand({
        Bucket: config.minio.bucket,
      })
    );
    return response.CORSRules ?? [];
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) {
      return [];
    }
    throw error;
  }
};

const uploadObject = async ({ key, body, contentType }) => {
  ensureConfiguration();
  const command = new PutObjectCommand({
    Bucket: config.minio.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await client.send(command);

  return {
    key,
  };
};

const createPresignedGetUrl = (key) =>
  getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: config.minio.bucket,
      Key: key,
    }),
    { expiresIn: config.minio.presignExpiration }
  );

module.exports = {
  client,
  checkConnection,
  checkBucket,
  getCorsRules,
  uploadObject,
  createPresignedGetUrl,
};
