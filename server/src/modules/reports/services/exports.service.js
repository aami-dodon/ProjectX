const { randomUUID } = require('crypto');
const XLSX = require('xlsx');

const { env } = require('@/config/env');
const { getPresignedDownloadUrl, minioClient, verifyBucket } = require('@/integrations/minio');
const { createLogger } = require('@/utils/logger');
const { createNotFoundError, createValidationError } = require('@/utils/errors');
const {
  createExportRecord,
  findExportById,
  logExportEvent,
  updateExportRecord,
} = require('../repositories/exports.repository');
const {
  getFrameworkScoresDashboard,
  getControlHealthDashboard,
  getRemediationDashboard,
  getEvidenceDashboard,
} = require('./dashboard.service');
const { buildRowsForExport } = require('../templates/export-templates');

const logger = createLogger('reports-exports-service');

const EXPORT_FORMATS = ['JSON', 'CSV', 'XLSX'];
const EXPORT_TYPES = [
  'FRAMEWORK_ATTESTATION',
  'CONTROL_BREAKDOWN',
  'REMEDIATION_DIGEST',
  'EVIDENCE_OVERVIEW',
];

const resolveFilters = (filters) => {
  if (!filters) return {};
  if (typeof filters === 'object' && !Array.isArray(filters)) {
    return filters;
  }
  return {};
};

const buildDataset = async (exportType, filters) => {
  switch (exportType) {
    case 'FRAMEWORK_ATTESTATION':
      return getFrameworkScoresDashboard(filters);
    case 'CONTROL_BREAKDOWN':
      return getControlHealthDashboard(filters);
    case 'REMEDIATION_DIGEST':
      return getRemediationDashboard(filters);
    case 'EVIDENCE_OVERVIEW':
      return getEvidenceDashboard(filters);
    default:
      throw createValidationError(`Unsupported export type: ${exportType}`);
  }
};

const convertRowsToCsv = (rows = []) => {
  if (!rows.length) return Buffer.from('', 'utf-8');
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || typeof value === 'undefined') {
        return '';
      }
      if (typeof value === 'number') {
        return value;
      }
      const serialized = String(value).replace(/"/g, '""');
      if (serialized.includes(',') || serialized.includes('\n')) {
        return `"${serialized}"`;
      }
      return serialized;
    });
    lines.push(values.join(','));
  });
  return Buffer.from(lines.join('\n'), 'utf-8');
};

const formatArtifact = (rows, format, payload) => {
  if (format === 'JSON') {
    const json = JSON.stringify({ generatedAt: new Date().toISOString(), rows, payload }, null, 2);
    return { buffer: Buffer.from(json, 'utf-8'), encoding: 'json' };
  }

  if (format === 'CSV') {
    return { buffer: convertRowsToCsv(rows), encoding: 'base64' };
  }

  if (format === 'XLSX') {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return { buffer, encoding: 'base64' };
  }

  throw createValidationError(`Unknown export format: ${format}`);
};

const persistArtifact = async (buffer, format) => {
  const bucket = env.REPORTS_EXPORT_BUCKET || env.MINIO_BUCKET;
  const extension = format.toLowerCase();
  const objectName = `reports/${format.toLowerCase()}/${Date.now()}-${randomUUID()}.${extension}`;

  try {
    await verifyBucket(bucket);
    await minioClient.putObject(bucket, objectName, buffer);
    return { bucket, objectName };
  } catch (error) {
    logger.warn('Falling back to inline artifact payload', {
      bucket,
      objectName,
      reason: error.message,
    });
    return {
      inlinePayload: buffer.toString('base64'),
      inlineEncoding: 'base64',
    };
  }
};

const buildDownloadUrl = async (record) => {
  if (!record?.artifactBucket || !record?.artifactObjectName) {
    return null;
  }

  try {
    return await getPresignedDownloadUrl(
      record.artifactBucket,
      record.artifactObjectName,
      env.REPORTS_EXPORT_URL_EXPIRATION_SECONDS,
    );
  } catch (error) {
    logger.warn('Unable to generate presigned export URL', {
      exportId: record.id,
      error: error.message,
    });
    return null;
  }
};

const serializeExport = async (record) => ({
  id: record.id,
  exportType: record.exportType,
  format: record.format,
  status: record.status,
  filters: record.filters ?? {},
  schedule: record.schedule ?? null,
  failureReason: record.failureReason ?? null,
  completedAt: record.completedAt,
  requestedBy: record.requestedBy ?? null,
  artifact: {
    bucket: record.artifactBucket,
    objectName: record.artifactObjectName,
    inlinePayload: record.artifactInlinePayload ?? null,
    inlineEncoding: record.artifactInlineEncoding ?? null,
    downloadUrl: await buildDownloadUrl(record),
  },
});

const processExport = async ({ record, filters, actorId }) => {
  await logExportEvent({
    exportId: record.id,
    actorId,
    eventType: 'EXPORT_PROCESSING',
    payload: { exportType: record.exportType, format: record.format },
  });

  const dataset = await buildDataset(record.exportType, filters);
  const rows = buildRowsForExport(record.exportType, dataset);
  const artifact = formatArtifact(rows, record.format, dataset);
  const storage = await persistArtifact(artifact.buffer, record.format);

  const updated = await updateExportRecord(record.id, {
    status: 'COMPLETED',
    completedAt: new Date(),
    artifactBucket: storage.bucket ?? null,
    artifactObjectName: storage.objectName ?? null,
    artifactInlinePayload: storage.inlinePayload ?? null,
    artifactInlineEncoding: storage.inlineEncoding ?? (storage.inlinePayload ? artifact.encoding : null),
    failureReason: null,
  });

  await logExportEvent({
    exportId: record.id,
    actorId,
    eventType: 'EXPORT_COMPLETED',
    payload: { rows: rows.length },
  });

  return serializeExport(updated);
};

const createExportJob = async ({ exportType, format, filters, schedule, actorId }) => {
  if (!EXPORT_TYPES.includes(exportType)) {
    throw createValidationError(`Unsupported export type: ${exportType}`);
  }
  if (!EXPORT_FORMATS.includes(format)) {
    throw createValidationError(`Unsupported export format: ${format}`);
  }

  const record = await createExportRecord({
    exportType,
    format,
    filters: resolveFilters(filters),
    schedule,
    requestedById: actorId ?? null,
    status: 'PROCESSING',
  });

  try {
    return await processExport({ record, filters: resolveFilters(filters), actorId });
  } catch (error) {
    await updateExportRecord(record.id, {
      status: 'FAILED',
      failureReason: error.message,
    });
    await logExportEvent({
      exportId: record.id,
      actorId,
      eventType: 'EXPORT_FAILED',
      payload: { message: error.message },
    });
    throw error;
  }
};

const getExportJob = async (exportId) => {
  const record = await findExportById(exportId);
  if (!record) {
    throw createNotFoundError('Export job not found', { exportId });
  }
  return serializeExport(record);
};

const retryExportJob = async ({ exportId, actorId }) => {
  const record = await findExportById(exportId);
  if (!record) {
    throw createNotFoundError('Export job not found', { exportId });
  }

  if (record.status === 'PROCESSING') {
    throw createValidationError('Export job is already processing');
  }

  const refreshed = await updateExportRecord(record.id, {
    status: 'PROCESSING',
    completedAt: null,
    failureReason: null,
  });

  try {
    return await processExport({
      record: refreshed,
      filters: resolveFilters(record.filters),
      actorId: actorId ?? record.requestedById ?? null,
    });
  } catch (error) {
    await updateExportRecord(record.id, {
      status: 'FAILED',
      failureReason: error.message,
    });
    await logExportEvent({
      exportId: record.id,
      actorId,
      eventType: 'EXPORT_FAILED',
      payload: { message: error.message },
    });
    throw error;
  }
};

module.exports = {
  createExportJob,
  getExportJob,
  retryExportJob,
};
