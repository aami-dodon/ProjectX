const path = require('node:path');

const { env } = require('@/config/env');
const { createUnauthorizedError, createValidationError } = require('@/utils/errors');
const { getPresignedDownloadUrl, getPresignedUploadUrl } = require('@/integrations/minio');

const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  documents: ['application/pdf'],
};

const STORAGE_PATHS = {
  images: 'uploads/images',
  documents: 'uploads/docs',
};

const sanitizeUserSegment = (userId) => {
  if (!userId) {
    throw createValidationError('A valid user identifier is required');
  }

  const normalized = encodeURIComponent(String(userId).trim());
  if (!normalized) {
    throw createValidationError('A valid user identifier is required');
  }

  return normalized;
};

const normalizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    throw createValidationError('A valid filename is required');
  }

  return path.posix.basename(filename);
};

const normalizeMimeType = (mimeType) => {
  if (!mimeType || typeof mimeType !== 'string') {
    throw createValidationError('A valid MIME type is required');
  }

  return mimeType.toLowerCase();
};

const normalizeObjectName = (objectName) => {
  if (!objectName || typeof objectName !== 'string') {
    throw createValidationError('A valid object name is required');
  }

  const trimmed = objectName.trim();
  if (!trimmed) {
    throw createValidationError('A valid object name is required');
  }

  const sanitized = trimmed.replace(/^\/+/, '');
  if (sanitized.includes('..')) {
    throw createValidationError('Invalid object name');
  }

  return sanitized;
};

const classifyFile = (mimeType) => {
  const normalizedType = normalizeMimeType(mimeType);

  if (ALLOWED_TYPES.images.includes(normalizedType)) {
    return 'images';
  }

  if (ALLOWED_TYPES.documents.includes(normalizedType)) {
    return 'documents';
  }

  throw createValidationError(`Unsupported file type: ${normalizedType}`);
};

const buildObjectName = ({ folder, userSegment, filename }) => {
  const timestamp = Date.now();
  const safeFilename = normalizeFilename(filename);

  return path.posix.join(folder, userSegment, `${timestamp}-${safeFilename}`);
};

const createUploadSlot = async (userId, filename, mimeType) => {
  const userSegment = sanitizeUserSegment(userId);
  const category = classifyFile(mimeType);
  const folder = STORAGE_PATHS[category];
  const objectName = buildObjectName({ folder, userSegment, filename });
  const bucket = env.MINIO_BUCKET;

  const uploadUrl = await getPresignedUploadUrl(bucket, objectName);
  const fileUrl = `${bucket}/${objectName}`;

  return { uploadUrl, fileUrl, category, objectName };
};

const getFileAccessLink = async (objectName, userId) => {
  const userSegment = sanitizeUserSegment(userId);
  const normalizedObjectName = normalizeObjectName(objectName);

  const allowedPrefixes = Object.values(STORAGE_PATHS).map((folder) => `${folder}/${userSegment}/`);
  const hasAccess = allowedPrefixes.some((prefix) => normalizedObjectName.startsWith(prefix));

  if (!hasAccess) {
    throw createUnauthorizedError('You do not have permission to access this file');
  }

  const bucket = env.MINIO_BUCKET;
  const url = await getPresignedDownloadUrl(bucket, normalizedObjectName);

  return { url };
};

module.exports = {
  ALLOWED_TYPES,
  STORAGE_PATHS,
  classifyFile,
  createUploadSlot,
  getFileAccessLink,
};
