const { prisma } = require('@/integrations/prisma');

const normalizeFilterList = (value) => {
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
  states,
  priorities,
  assignedTo,
  dueBefore,
  dueAfter,
  checkIds,
} = {}) => {
  const where = {};

  const normalizedStates = normalizeFilterList(states).map((state) => state.toUpperCase());
  if (normalizedStates.length > 0) {
    where.state = { in: normalizedStates };
  }

  const normalizedPriorities = normalizeFilterList(priorities).map((priority) =>
    priority.toUpperCase(),
  );
  if (normalizedPriorities.length > 0) {
    where.priority = { in: normalizedPriorities };
  }

  const normalizedChecks = normalizeFilterList(checkIds);
  if (normalizedChecks.length > 0) {
    where.checkId = { in: normalizedChecks };
  }

  if (assignedTo && typeof assignedTo === 'string') {
    where.assignedTo = assignedTo.trim();
  }

  if (dueBefore || dueAfter) {
    where.dueAt = {};
    if (dueBefore) {
      where.dueAt.lte = dueBefore;
    }
    if (dueAfter) {
      where.dueAt.gte = dueAfter;
    }
  }

  return where;
};

const resolveOrderBy = (sort) => {
  if (!sort || typeof sort !== 'string') {
    return [
      { priority: 'desc' },
      { dueAt: 'asc' },
    ];
  }

  const [field, direction] = sort.split(':').map((entry) => entry.trim());
  const normalizedDirection = direction?.toLowerCase() === 'asc' ? 'asc' : 'desc';
  return [{ [field || 'dueAt']: normalizedDirection }];
};

const listReviewQueueItems = async ({
  limit = 25,
  offset = 0,
  sort,
  ...filters
} = {}) =>
  prisma.reviewQueueItem.findMany({
    where: buildWhereClause(filters),
    include: {
      check: {
        select: {
          id: true,
          name: true,
          severityDefault: true,
          type: true,
        },
      },
      result: {
        select: {
          id: true,
          status: true,
          severity: true,
          executedAt: true,
        },
      },
    },
    orderBy: resolveOrderBy(sort),
    take: limit,
    skip: offset,
  });

const countReviewQueueItems = async (filters = {}) =>
  prisma.reviewQueueItem.count({
    where: buildWhereClause(filters),
  });

const createReviewQueueItem = async (data) =>
  prisma.reviewQueueItem.create({
    data,
    include: {
      check: true,
      result: true,
    },
  });

const findReviewQueueItemById = async (id) =>
  prisma.reviewQueueItem.findUnique({
    where: { id },
    include: {
      check: true,
      result: true,
    },
  });

const updateReviewQueueItem = async (id, data) =>
  prisma.reviewQueueItem.update({
    where: { id },
    data,
    include: {
      check: true,
      result: true,
    },
  });

module.exports = {
  countReviewQueueItems,
  createReviewQueueItem,
  findReviewQueueItemById,
  listReviewQueueItems,
  updateReviewQueueItem,
};
