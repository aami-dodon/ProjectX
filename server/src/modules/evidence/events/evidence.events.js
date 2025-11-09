const { prisma } = require('@/integrations/prisma');
const { getAuditContext } = require('@/utils/audit-context-store');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('evidence-events');

const recordEvidenceEvent = async ({ evidenceId, action, actorId = null, metadata = null }) => {
  const context = getAuditContext();

  try {
    return await prisma.evidenceEvent.create({
      data: {
        evidenceId,
        action,
        actorId: actorId ?? context.userId ?? null,
        ipAddress: context.ip ?? null,
        userAgent: context.userAgent ?? null,
        metadata,
      },
    });
  } catch (error) {
    logger.error('Failed to record evidence event', {
      evidenceId,
      action,
      error: error.message,
    });
    throw error;
  }
};

module.exports = {
  recordEvidenceEvent,
};
