const { prisma } = require('@/integrations/prisma');

const buildAuditWhere = ({
  model,
  action,
  startDate,
  endDate,
  searchTerm,
  searchActions,
  searchUserIds,
} = {}) => {
  const where = {};

  if (typeof model === 'string' && model.trim()) {
    where.model = model.trim();
  }

  if (typeof action === 'string' && action.trim()) {
    where.action = action.trim();
  }

  if (startDate || endDate) {
    where.timestamp = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  const orFilters = [];

  if (Array.isArray(searchActions) && searchActions.length > 0) {
    searchActions
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .forEach((actionValue) => {
        orFilters.push({ action: actionValue });
      });
  }

  if (searchTerm && typeof searchTerm === 'string') {
    const trimmed = searchTerm.trim();
    if (trimmed) {
      orFilters.push({ model: { contains: trimmed, mode: 'insensitive' } });
      orFilters.push({ recordId: { contains: trimmed, mode: 'insensitive' } });
      orFilters.push({ ip: { contains: trimmed, mode: 'insensitive' } });
      orFilters.push({ userAgent: { contains: trimmed, mode: 'insensitive' } });
    }
  }

  if (Array.isArray(searchUserIds) && searchUserIds.length > 0) {
    const uniqueIds = Array.from(
      new Set(
        searchUserIds.filter((userId) => typeof userId === 'string' && userId.trim().length > 0),
      ),
    );

    if (uniqueIds.length > 0) {
      orFilters.push({ performedById: { in: uniqueIds } });
      orFilters.push({ affectedUserId: { in: uniqueIds } });
    }
  }

  if (orFilters.length > 0) {
    where.OR = orFilters;
  }

  return Object.keys(where).length > 0 ? where : undefined;
};

const findRecentAuditLogs = async ({
  limit,
  offset = 0,
  model,
  action,
  startDate,
  endDate,
  searchTerm,
  searchActions,
  searchUserIds,
} = {}) =>
  prisma.auditLog.findMany({
    where: buildAuditWhere({
      model,
      action,
      startDate,
      endDate,
      searchTerm,
      searchActions,
      searchUserIds,
    }),
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
  });

const countAuditLogs = async ({
  model,
  action,
  startDate,
  endDate,
  searchTerm,
  searchActions,
  searchUserIds,
} = {}) =>
  prisma.auditLog.count({
    where: buildAuditWhere({
      model,
      action,
      startDate,
      endDate,
      searchTerm,
      searchActions,
      searchUserIds,
    }),
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

const findAuditUserIdsBySearchTerm = async (searchTerm) => {
  if (typeof searchTerm !== 'string') {
    return [];
  }

  const trimmed = searchTerm.trim();
  if (!trimmed) {
    return [];
  }

  const matches = await prisma.authUser.findMany({
    where: {
      OR: [
        { email: { contains: trimmed, mode: 'insensitive' } },
        { fullName: { contains: trimmed, mode: 'insensitive' } },
      ],
    },
    select: { id: true },
    take: 50,
  });

  return matches.map((match) => match.id);
};

module.exports = {
  findRecentAuditLogs,
  countAuditLogs,
  findAuditUsersByIds,
  findAuditUserIdsBySearchTerm,
};
