const { prisma } = require('@/integrations/prisma');

const findRecentAuditLogs = async (limit) =>
  prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

module.exports = {
  findRecentAuditLogs,
};
