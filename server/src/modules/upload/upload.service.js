const { randomUUID } = require('node:crypto');

const { env } = require('@/config/env');
const { minioClient } = require('@/integrations/minio');

const IMAGE_EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const normalizePrefix = (prefix) => {
  if (!prefix || typeof prefix !== 'string') {
    return '';
  }

  return prefix
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .join('/');
};

const resolveObjectExtension = (contentType, extensionMap = IMAGE_EXTENSION_BY_MIME) => {
  if (!contentType || typeof contentType !== 'string') {
    return '';
  }

  const normalized = contentType.toLowerCase();
  const map = extensionMap && typeof extensionMap === 'object' ? extensionMap : IMAGE_EXTENSION_BY_MIME;
  const mapped = map[normalized];

  if (mapped) {
    return `.${mapped}`;
  }

  const [, subtype] = normalized.split('/');
  return subtype ? `.${subtype.replace(/[^a-z0-9.+-]/gi, '')}` : '';
};

const createPresignedUpload = async ({
  contentType,
  prefix = 'uploads',
  bucket = env.MINIO_BUCKET,
  expiresIn = env.MINIO_PRESIGNED_URL_EXPIRATION_SECONDS,
  extensionMap = IMAGE_EXTENSION_BY_MIME,
  headers = {},
}) => {
  const sanitizedPrefix = normalizePrefix(prefix);
  const extension = resolveObjectExtension(contentType, extensionMap);
  const objectKey = [sanitizedPrefix, `${Date.now()}-${randomUUID()}${extension}`]
    .filter(Boolean)
    .join('/');

  const uploadUrl = await minioClient.presignedPutObject(bucket, objectKey, expiresIn);
  const downloadUrl = await minioClient.presignedGetObject(bucket, objectKey, expiresIn);

  const responseHeaders = { ...headers };
  if (contentType && !responseHeaders['Content-Type']) {
    responseHeaders['Content-Type'] = contentType;
  }

  return {
    bucket,
    objectName: objectKey,
    uploadUrl,
    downloadUrl,
    expiresIn,
    headers: responseHeaders,
  };
};

module.exports = {
  IMAGE_EXTENSION_BY_MIME,
  createPresignedUpload,
  resolveObjectExtension,
};
