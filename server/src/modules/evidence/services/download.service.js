const { EvidenceEventAction } = require('@prisma/client');
const { env } = require('@/config/env');
const { getPresignedDownloadUrl } = require('@/integrations/minio');
const { createNotFoundError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const {
  findEvidenceById,
  incrementDownloadCount,
} = require('../repositories/evidence.repository');
const { recordEvidenceEvent } = require('../events/evidence.events');

const logger = createLogger('evidence-download-service');

const requestDownloadLink = async ({ evidenceId, actorId }) => {
  const record = await findEvidenceById(evidenceId);
  if (!record) {
    throw createNotFoundError('Evidence record not found');
  }

  const url = await getPresignedDownloadUrl(
    record.bucket,
    record.objectName,
    env.MINIO_PRESIGNED_URL_EXPIRATION_SECONDS,
  );

  await incrementDownloadCount(evidenceId);

  await recordEvidenceEvent({
    evidenceId,
    action: EvidenceEventAction.DOWNLOAD_ISSUED,
    actorId,
    metadata: {
      mimeType: record.mimeType,
      size: record.size,
    },
  });

  logger.info('Issued evidence download URL', {
    evidenceId,
    actorId,
  });

  return {
    url,
    expiresIn: env.MINIO_PRESIGNED_URL_EXPIRATION_SECONDS,
    objectName: record.objectName,
    bucket: record.bucket,
    mimeType: record.mimeType,
    size: record.size,
  };
};

module.exports = {
  requestDownloadLink,
};
