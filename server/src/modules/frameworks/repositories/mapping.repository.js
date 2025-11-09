const { prisma } = require('@/integrations/prisma');

const MAPPING_INCLUDE = {
  sourceControl: {
    select: {
      id: true,
      code: true,
      title: true,
    },
  },
  targetControl: {
    select: {
      id: true,
      code: true,
      title: true,
      frameworkId: true,
    },
  },
  targetFramework: {
    select: {
      id: true,
      title: true,
      slug: true,
    },
  },
};

const normalizeArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const buildWhereClause = ({
  frameworkId,
  targetFrameworkId,
  strength,
  statuses,
  controlId,
} = {}) => {
  const where = {
    sourceFrameworkId: frameworkId,
  };

  if (targetFrameworkId) {
    where.targetFrameworkId = targetFrameworkId;
  }

  const normalizedStrengths = normalizeArray(strength).map((entry) =>
    entry.toUpperCase(),
  );
  if (normalizedStrengths.length > 0) {
    where.mappingStrength = { in: normalizedStrengths };
  }

  const normalizedStatuses = normalizeArray(statuses).map((entry) =>
    entry.toUpperCase(),
  );
  if (normalizedStatuses.length > 0) {
    where.status = { in: normalizedStatuses };
  }

  if (controlId) {
    where.sourceControlId = controlId;
  }

  return where;
};

const listFrameworkMappings = async ({
  frameworkId,
  limit = 25,
  offset = 0,
  ...filters
} = {}) =>
  prisma.frameworkMapping.findMany({
    where: buildWhereClause({ frameworkId, ...filters }),
    include: MAPPING_INCLUDE,
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset,
  });

const countFrameworkMappings = async ({ frameworkId, ...filters } = {}) =>
  prisma.frameworkMapping.count({
    where: buildWhereClause({ frameworkId, ...filters }),
  });

const countMappingsByFramework = async (frameworkIds = []) => {
  if (!Array.isArray(frameworkIds) || frameworkIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.frameworkMapping.groupBy({
    by: ['sourceFrameworkId'],
    where: {
      sourceFrameworkId: { in: frameworkIds },
    },
    _count: {
      _all: true,
    },
  });

  return new Map(
    rows.map((row) => [
      row.sourceFrameworkId,
      row._count?._all ?? 0,
    ]),
  );
};

const groupMappingsByStrength = async (frameworkId) =>
  prisma.frameworkMapping.groupBy({
    by: ['mappingStrength'],
    where: { sourceFrameworkId: frameworkId },
    _count: { _all: true },
  });

const groupMappingsByTarget = async (frameworkId) =>
  prisma.frameworkMapping.groupBy({
    by: ['targetFrameworkId', 'mappingStrength'],
    where: { sourceFrameworkId: frameworkId },
    _count: { _all: true },
  });

const createFrameworkMappingRecord = async (data) =>
  prisma.frameworkMapping.create({
    data,
    include: MAPPING_INCLUDE,
  });

const recordMappingHistoryEntry = async ({
  mappingId,
  actorId,
  changeType,
  payloadBefore,
  payloadAfter,
  justification,
  metadata,
}) =>
  prisma.frameworkMappingHistory.create({
    data: {
      mappingId,
      actorId: actorId ?? null,
      changeType: changeType ?? 'UPDATED',
      payloadBefore: payloadBefore ?? null,
      payloadAfter: payloadAfter ?? null,
      justification: justification ?? null,
      metadata: metadata ?? null,
    },
  });

module.exports = {
  countFrameworkMappings,
  countMappingsByFramework,
  createFrameworkMappingRecord,
  groupMappingsByStrength,
  groupMappingsByTarget,
  listFrameworkMappings,
  recordMappingHistoryEntry,
};
