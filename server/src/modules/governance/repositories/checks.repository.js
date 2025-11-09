const { prisma } = require('@/integrations/prisma');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('governance-checks-repo');

const normalizeArrayFilter = (value) => {
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
  statuses,
  types,
  controlIds,
  probeIds,
  search,
  severities,
} = {}) => {
  const where = {};

  const normalizedStatuses = normalizeArrayFilter(statuses).map((status) =>
    status.toUpperCase(),
  );
  if (normalizedStatuses.length > 0) {
    where.status = { in: normalizedStatuses };
  }

  const normalizedTypes = normalizeArrayFilter(types).map((type) =>
    type.toUpperCase(),
  );
  if (normalizedTypes.length > 0) {
    where.type = { in: normalizedTypes };
  }

  const normalizedSeverities = normalizeArrayFilter(severities).map((severity) =>
    severity.toUpperCase(),
  );
  if (normalizedSeverities.length > 0) {
    where.severityDefault = { in: normalizedSeverities };
  }

  const normalizedProbes = normalizeArrayFilter(probeIds);
  if (normalizedProbes.length > 0) {
    where.probeId = { in: normalizedProbes };
  }

  const normalizedControls = normalizeArrayFilter(controlIds);
  if (normalizedControls.length > 0) {
    where.controlLinks = {
      some: {
        controlId: { in: normalizedControls },
      },
    };
  }

  if (search && typeof search === 'string') {
    const trimmed = search.trim();
    if (trimmed) {
      where.OR = [
        { name: { contains: trimmed, mode: 'insensitive' } },
        { description: { contains: trimmed, mode: 'insensitive' } },
      ];
    }
  }

  return where;
};

const resolveOrderBy = (sort) => {
  if (!sort || typeof sort !== 'string') {
    return { updatedAt: 'desc' };
  }

  const [field, direction] = sort.split(':').map((entry) => entry.trim());
  if (!field) {
    return { updatedAt: 'desc' };
  }

  const normalizedDirection =
    direction && direction.toLowerCase() === 'asc' ? 'asc' : 'desc';

  switch (field) {
    case 'name':
    case 'status':
    case 'type':
    case 'severityDefault':
    case 'updatedAt':
    case 'nextRunAt':
      return { [field]: normalizedDirection };
    default:
      return { updatedAt: 'desc' };
  }
};

const CHECK_INCLUDE = {
  controlLinks: true,
  reviewQueue: {
    where: {
      state: { in: ['OPEN', 'IN_PROGRESS'] },
    },
    orderBy: [
      { priority: 'desc' },
      { dueAt: 'asc' },
    ],
  },
  results: {
    orderBy: { executedAt: 'desc' },
    take: 1,
  },
};

const listChecks = async ({
  limit = 25,
  offset = 0,
  statuses,
  types,
  controlIds,
  probeIds,
  severities,
  search,
  sort,
} = {}) => {
  return prisma.check.findMany({
    where: buildWhereClause({
      statuses,
      types,
      controlIds,
      probeIds,
      severities,
      search,
    }),
    include: CHECK_INCLUDE,
    orderBy: resolveOrderBy(sort),
    take: limit,
    skip: offset,
  });
};

const countChecks = async (filters = {}) =>
  prisma.check.count({
    where: buildWhereClause(filters),
  });

const findCheckById = async (id) =>
  prisma.check.findUnique({
    where: { id },
    include: CHECK_INCLUDE,
  });

const createCheckRecord = async ({
  controlLinks = [],
  ...data
}) => {
  return prisma.$transaction(async (tx) => {
    const record = await tx.check.create({
      data,
    });

    if (Array.isArray(controlLinks) && controlLinks.length > 0) {
      await tx.checkControlLink.createMany({
        data: controlLinks.map((link) => ({
          checkId: record.id,
          controlId: link.controlId,
          weight: link.weight ?? 1,
          enforcementLevel: link.enforcementLevel ?? 'OPTIONAL',
          evidenceRequirements: link.evidenceRequirements ?? null,
          metadata: link.metadata ?? null,
        })),
        skipDuplicates: true,
      });
    }

    return tx.check.findUnique({
      where: { id: record.id },
      include: CHECK_INCLUDE,
    });
  });
};

const updateCheckRecord = async (id, { controlLinks, ...data }) => {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.check.update({
      where: { id },
      data,
    });

    if (Array.isArray(controlLinks)) {
      await tx.checkControlLink.deleteMany({ where: { checkId: id } });

      if (controlLinks.length > 0) {
        await tx.checkControlLink.createMany({
          data: controlLinks.map((link) => ({
            checkId: id,
            controlId: link.controlId,
            weight: link.weight ?? 1,
            enforcementLevel: link.enforcementLevel ?? 'OPTIONAL',
            evidenceRequirements: link.evidenceRequirements ?? null,
            metadata: link.metadata ?? null,
          })),
          skipDuplicates: true,
        });
      }
    }

    return tx.check.findUnique({
      where: { id: updated.id },
      include: CHECK_INCLUDE,
    });
  });
};

const recordVersionSnapshot = async ({ checkId, version, statusSnapshot, definition, diff, notes, createdBy }) => {
  try {
    return await prisma.checkVersion.create({
      data: {
        checkId,
        version,
        statusSnapshot,
        definition,
        diff: diff ?? null,
        notes: notes ?? null,
        createdBy: createdBy ?? null,
      },
    });
  } catch (error) {
    logger.warn('Failed to persist check version snapshot', {
      error: error.message,
      checkId,
      version,
    });
    return null;
  }
};

const getControlCoverageMetrics = async () =>
  prisma.checkControlLink.findMany({
    include: {
      check: {
        select: {
          severityDefault: true,
          status: true,
        },
      },
    },
  });

const listDueChecks = async ({ now = new Date(), limit = 25 } = {}) =>
  prisma.check.findMany({
    where: {
      status: 'ACTIVE',
      nextRunAt: {
        lte: now,
      },
    },
    orderBy: { nextRunAt: 'asc' },
    take: limit,
  });

const touchCheckRunMetadata = async (id, { lastRunAt, nextRunAt }) =>
  prisma.check.update({
    where: { id },
    data: {
      lastRunAt,
      nextRunAt,
    },
  });

module.exports = {
  countChecks,
  createCheckRecord,
  findCheckById,
  getControlCoverageMetrics,
  getCheckAggregates: async () => {
    const [statusGroups, typeGroups, severityGroups] = await Promise.all([
      prisma.check.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.check.groupBy({
        by: ['type'],
        _count: { _all: true },
      }),
      prisma.check.groupBy({
        by: ['severityDefault'],
        _count: { _all: true },
      }),
    ]);

    return {
      status: statusGroups,
      type: typeGroups,
      severity: severityGroups,
    };
  },
  listChecks,
  listDueChecks,
  recordVersionSnapshot,
  touchCheckRunMetadata,
  updateCheckRecord,
};
