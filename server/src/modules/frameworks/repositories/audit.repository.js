const { prisma } = require('@/integrations/prisma');

const createFrameworkAuditLogEntry = async ({
  frameworkId,
  entityType = 'framework',
  entityId,
  action,
  actorId,
  payloadBefore,
  payloadAfter,
  metadata,
}) =>
  prisma.frameworkAuditLog.create({
    data: {
      frameworkId: frameworkId ?? entityId ?? null,
      entityType: entityType ?? 'framework',
      entityId: entityId ?? frameworkId ?? null,
      action,
      actorId: actorId ?? null,
      payloadBefore: payloadBefore ?? null,
      payloadAfter: payloadAfter ?? null,
      metadata: metadata ?? null,
    },
  });

module.exports = {
  createFrameworkAuditLogEntry,
};
