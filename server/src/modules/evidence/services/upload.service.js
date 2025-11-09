const crypto = require('node:crypto');
const path = require('node:path');

const { EvidenceEventAction } = require('@prisma/client');
const { env } = require('@/config/env');
const { getPresignedUploadUrl } = require('@/integrations/minio');
const { createValidationError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const {
  createEvidenceRecord,
  ensureDefaultRetentionPolicy,
  findRetentionPolicyById,
} = require('../repositories/evidence.repository');
const { recordEvidenceEvent } = require('../events/evidence.events');
const { serializeEvidenceRecord } = require('../evidence.serializers');
const { UPLOAD_REQUEST_SCHEMA } = require('../evidence.schemas');

const logger = createLogger('evidence-upload-service');

const createObjectName = (filename) => {
  const normalized = (filename ?? 'artifact').trim() || 'artifact';
  const safeName = normalized
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  const extension = path.extname(normalized) || '';
  const base = safeName.replace(extension, '') || 'artifact';
  return `evidence/${new Date().getUTCFullYear()}/${crypto.randomUUID()}-${base}${extension}`;
};

const normalizeLinks = (parsedPayload) => {
  const links = [];

  (parsedPayload.controlIds ?? []).forEach((controlId) => {
    links.push({ controlId, role: 'CONTROL' });
  });

  (parsedPayload.checkIds ?? []).forEach((checkId) => {
    links.push({ checkId, role: 'CHECK' });
  });

  (parsedPayload.taskReferences ?? []).forEach((taskReference) => {
    links.push({ taskReference, role: 'TASK' });
  });

  (parsedPayload.links ?? []).forEach((link) => {
    if (!link.controlId && !link.checkId && !link.taskReference) {
      throw createValidationError('Each link must reference a control, check, or task', {
        field: 'links',
      });
    }
    links.push(link);
  });

  return links;
};

const requestUploadSession = async ({ payload, actorId }) => {
  const parsed = await UPLOAD_REQUEST_SCHEMA.parseAsync(payload ?? {});

  let retentionPolicyId = parsed.retentionPolicyId ?? null;
  if (retentionPolicyId) {
    const policy = await findRetentionPolicyById(retentionPolicyId);
    if (!policy) {
      throw createValidationError('Retention policy could not be found', {
        field: 'retentionPolicyId',
      });
    }
  } else {
    const defaultPolicy = await ensureDefaultRetentionPolicy();
    retentionPolicyId = defaultPolicy.id;
  }

  const bucket = env.MINIO_BUCKET;
  const objectName = createObjectName(parsed.filename);
  const linkInputs = normalizeLinks(parsed);

  const record = await createEvidenceRecord({
    data: {
      displayName: parsed.filename,
      description: parsed.description ?? null,
      mimeType: parsed.mimeType,
      size: parsed.size,
      checksum: parsed.checksum,
      tags: parsed.tags ?? [],
      source: parsed.source,
      retentionState: parsed.retentionState,
      retentionPolicyId,
      metadata: parsed.metadata ?? null,
      storageKey: objectName,
      objectName,
      bucket,
      uploaderId: actorId,
    },
    linkInputs,
  });

  const uploadUrl = await getPresignedUploadUrl(
    bucket,
    objectName,
    env.MINIO_PRESIGNED_URL_EXPIRATION_SECONDS,
  );

  await recordEvidenceEvent({
    evidenceId: record.id,
    action: EvidenceEventAction.UPLOAD_REQUESTED,
    actorId,
    metadata: {
      filename: parsed.filename,
      mimeType: parsed.mimeType,
      size: parsed.size,
    },
  });

  logger.info('Issued evidence upload session', {
    evidenceId: record.id,
    uploaderId: actorId,
    mimeType: parsed.mimeType,
  });

  return {
    evidence: serializeEvidenceRecord(record),
    upload: {
      url: uploadUrl,
      bucket,
      objectName,
      expiresIn: env.MINIO_PRESIGNED_URL_EXPIRATION_SECONDS,
    },
  };
};

module.exports = {
  requestUploadSession,
};
