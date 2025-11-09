const { prisma } = require('@/integrations/prisma');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('frameworks-repository');

const FRAMEWORK_INCLUDE = {
  activeVersion: true,
  _count: {
    select: {
      controls: true,
      sourceMappings: true,
    },
  },
};

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
  jurisdictions,
  publishers,
  domains,
  search,
} = {}) => {
  const where = {};

  const normalizedStatuses = normalizeArrayFilter(statuses).map((status) =>
    status.toUpperCase(),
  );
  if (normalizedStatuses.length > 0) {
    where.status = { in: normalizedStatuses };
  }

  const normalizedJurisdictions = normalizeArrayFilter(jurisdictions);
  if (normalizedJurisdictions.length > 0) {
    where.jurisdiction = { in: normalizedJurisdictions };
  }

  const normalizedPublishers = normalizeArrayFilter(publishers);
  if (normalizedPublishers.length > 0) {
    where.publisher = { in: normalizedPublishers };
  }

  const normalizedDomains = normalizeArrayFilter(domains);
  if (normalizedDomains.length > 0) {
    where.domain = { in: normalizedDomains };
  }

  if (typeof search === 'string' && search.trim()) {
    const query = search.trim();
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { slug: { contains: query, mode: 'insensitive' } },
      { publisher: { contains: query, mode: 'insensitive' } },
    ];
  }

  return where;
};

const resolveOrderBy = (sort) => {
  if (!sort || typeof sort !== 'string') {
    return { updatedAt: 'desc' };
  }

  const [field, direction] = sort.split(':').map((entry) => entry.trim());
  const normalizedDirection =
    direction && direction.toLowerCase() === 'asc' ? 'asc' : 'desc';

  switch (field) {
    case 'title':
    case 'slug':
    case 'status':
    case 'publisher':
    case 'jurisdiction':
    case 'updatedAt':
      return { [field]: normalizedDirection };
    default:
      return { updatedAt: 'desc' };
  }
};

const listFrameworkRecords = async ({
  limit = 25,
  offset = 0,
  ...filters
} = {}) => {
  return prisma.framework.findMany({
    where: buildWhereClause(filters),
    include: FRAMEWORK_INCLUDE,
    orderBy: resolveOrderBy(filters.sort),
    take: limit,
    skip: offset,
  });
};

const countFrameworkRecords = async (filters = {}) =>
  prisma.framework.count({
    where: buildWhereClause(filters),
  });

const aggregateFrameworkRecords = async () => {
  try {
    const [status, jurisdiction, publisher] = await prisma.$transaction([
      prisma.framework.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.framework.groupBy({
        by: ['jurisdiction'],
        _count: { _all: true },
        where: {
          jurisdiction: { not: null },
        },
      }),
      prisma.framework.groupBy({
        by: ['publisher'],
        _count: { _all: true },
        where: {
          publisher: { not: null },
        },
      }),
    ]);

    return { status, jurisdiction, publisher };
  } catch (error) {
    logger.warn('Failed to aggregate framework records', {
      error: error.message,
    });
    return { status: [], jurisdiction: [], publisher: [] };
  }
};

const createFrameworkRecord = async ({ frameworkData, versionData }) => {
  return prisma.$transaction(async (tx) => {
    const framework = await tx.framework.create({
      data: frameworkData,
    });

    const version = await tx.frameworkVersion.create({
      data: {
        frameworkId: framework.id,
        version: versionData?.version ?? '1.0.0',
        status: versionData?.status ?? 'DRAFT',
        changelog: versionData?.changelog ?? null,
        diffHash: versionData?.diffHash ?? null,
        diffSummary: versionData?.diffSummary ?? null,
        approvals: versionData?.approvals ?? null,
        metadata: versionData?.metadata ?? null,
        effectiveFrom: versionData?.effectiveFrom ?? framework.validFrom ?? null,
        effectiveTo: versionData?.effectiveTo ?? framework.validTo ?? null,
        publishedAt: versionData?.publishedAt ?? null,
      },
    });

    await tx.framework.update({
      where: { id: framework.id },
      data: { activeVersionId: version.id },
    });

    return tx.framework.findUnique({
      where: { id: framework.id },
      include: FRAMEWORK_INCLUDE,
    });
  });
};

const updateFrameworkRecord = async (frameworkId, data) =>
  prisma.framework.update({
    where: { id: frameworkId },
    data,
    include: FRAMEWORK_INCLUDE,
  });

const findFrameworkById = async (frameworkId) =>
  prisma.framework.findUnique({
    where: { id: frameworkId },
    include: FRAMEWORK_INCLUDE,
  });

const findFrameworksByIds = async (frameworkIds = []) => {
  if (!Array.isArray(frameworkIds) || frameworkIds.length === 0) {
    return [];
  }

  return prisma.framework.findMany({
    where: { id: { in: frameworkIds } },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });
};

module.exports = {
  aggregateFrameworkRecords,
  countFrameworkRecords,
  createFrameworkRecord,
  findFrameworkById,
  findFrameworksByIds,
  listFrameworkRecords,
  updateFrameworkRecord,
};
