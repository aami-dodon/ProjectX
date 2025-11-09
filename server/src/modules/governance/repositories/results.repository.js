const { prisma } = require('@/integrations/prisma');

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
  checkId,
  statuses,
  severities,
  published,
  controlIds,
  search,
  from,
  to,
} = {}) => {
  const where = {};

  if (checkId) {
    where.checkId = checkId;
  }

  const normalizedStatuses = normalizeArrayFilter(statuses).map((status) =>
    status.toUpperCase(),
  );
  if (normalizedStatuses.length > 0) {
    where.status = { in: normalizedStatuses };
  }

  const normalizedSeverities = normalizeArrayFilter(severities).map((severity) =>
    severity.toUpperCase(),
  );
  if (normalizedSeverities.length > 0) {
    where.severity = { in: normalizedSeverities };
  }

  const normalizedControls = normalizeArrayFilter(controlIds);
  if (normalizedControls.length > 0) {
    where.controlId = { in: normalizedControls };
  }

  if (typeof published === 'boolean') {
    where.publicationState = published ? 'PUBLISHED' : { not: 'PUBLISHED' };
  }

  if (search && typeof search === 'string') {
    const trimmed = search.trim();
    if (trimmed) {
      where.OR = [
        { notes: { contains: trimmed, mode: 'insensitive' } },
        { metadata: { path: ['summary'], string_contains: trimmed } },
      ];
    }
  }

  if (from || to) {
    where.executedAt = {};
    if (from) {
      where.executedAt.gte = from;
    }
    if (to) {
      where.executedAt.lte = to;
    }
  }

  return where;
};

const resolveOrderBy = (sort) => {
  if (!sort || typeof sort !== 'string') {
    return { executedAt: 'desc' };
  }

  const [field, direction] = sort.split(':').map((entry) => entry.trim());
  const normalizedDirection = direction?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  switch (field) {
    case 'severity':
    case 'status':
    case 'executedAt':
    case 'publishedAt':
      return { [field]: normalizedDirection };
    default:
      return { executedAt: 'desc' };
  }
};

const listResults = async ({
  checkId,
  statuses,
  severities,
  published,
  controlIds,
  limit = 25,
  offset = 0,
  sort,
  from,
  to,
  search,
} = {}) =>
  prisma.checkResult.findMany({
    where: buildWhereClause({
      checkId,
      statuses,
      severities,
      published,
      controlIds,
      from,
      to,
      search,
    }),
    orderBy: resolveOrderBy(sort),
    take: limit,
    skip: offset,
    include: {
      check: {
        select: {
          id: true,
          name: true,
          severityDefault: true,
        },
      },
      reviewQueueItem: true,
    },
  });

const countResults = async (filters = {}) =>
  prisma.checkResult.count({
    where: buildWhereClause(filters),
  });

const findResultById = async (resultId) =>
  prisma.checkResult.findUnique({
    where: { id: resultId },
    include: {
      check: true,
      reviewQueueItem: true,
    },
  });

const createResultRecord = async (data) =>
  prisma.checkResult.create({
    data,
    include: {
      check: true,
      reviewQueueItem: true,
    },
  });

const updateResultRecord = async (id, data) =>
  prisma.checkResult.update({
    where: { id },
    data,
    include: {
      check: true,
      reviewQueueItem: true,
    },
  });

module.exports = {
  countResults,
  createResultRecord,
  findResultById,
  listResults,
  updateResultRecord,
};
