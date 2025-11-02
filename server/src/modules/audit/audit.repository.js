const { prisma } = require('@/integrations/prisma');

const findRecentAuditLogs = async ({ limit, offset = 0, model } = {}) =>
  prisma.auditLog.findMany({
    where: model ? { model } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

const countAuditLogs = async ({ model } = {}) =>
  prisma.auditLog.count({
    where: model ? { model } : undefined,
  });

const findAuditUsersByIds = async (userIds = []) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  return prisma.authUser.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  });
};

module.exports = {
  findRecentAuditLogs,
  countAuditLogs,
  findAuditUsersByIds,
};
