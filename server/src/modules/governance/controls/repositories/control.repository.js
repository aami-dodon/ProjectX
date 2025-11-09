const { prisma } = require('@/integrations/prisma');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('governance-control-repository');

const FRAMEWORK_LINK_INCLUDE = {
  framework: {
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
    },
  },
  frameworkControl: {
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
    },
  },
};

const CONTROL_SUMMARY_INCLUDE = {
  frameworkLinks: {
    include: FRAMEWORK_LINK_INCLUDE,
    orderBy: { createdAt: 'asc' },
  },
  checkLinks: {
    include: {
      check: {
        select: {
          id: true,
          name: true,
          status: true,
          severityDefault: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  scores: {
    orderBy: { windowStart: 'desc' },
    take: 1,
  },
};

const CONTROL_DETAIL_INCLUDE = {
  ...CONTROL_SUMMARY_INCLUDE,
  scores: {
    orderBy: { windowStart: 'desc' },
    take: 12,
  },
  auditEvents: {
    orderBy: { createdAt: 'desc' },
    take: 25,
  },
};

const normalizeArrayFilter = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const buildWhereClause = ({
  statuses,
  riskTiers,
  domains,
  owners,
  search,
  tags,
  frameworkIds,
} = {}) => {
  const where = {};

  const normalizedStatuses = normalizeArrayFilter(statuses).map((value) =>
    value.toUpperCase(),
  );
  if (normalizedStatuses.length > 0) {
    where.status = { in: normalizedStatuses };
  }

  const normalizedRisk = normalizeArrayFilter(riskTiers).map((value) =>
    value.toUpperCase(),
  );
  if (normalizedRisk.length > 0) {
    where.riskTier = { in: normalizedRisk };
  }

  const normalizedDomains = normalizeArrayFilter(domains);
  if (normalizedDomains.length > 0) {
    where.domain = { in: normalizedDomains };
  }

  const normalizedOwners = normalizeArrayFilter(owners);
  if (normalizedOwners.length > 0) {
    where.ownerTeam = { in: normalizedOwners };
  }

  const normalizedTags = normalizeArrayFilter(tags);
  if (normalizedTags.length > 0) {
    where.tags = { hasSome: normalizedTags };
  }

  const normalizedFrameworks = normalizeArrayFilter(frameworkIds);
  if (normalizedFrameworks.length > 0) {
    where.frameworkLinks = {
      some: {
        OR: [
          { frameworkId: { in: normalizedFrameworks } },
          { frameworkControlId: { in: normalizedFrameworks } },
        ],
      },
    };
  }

  if (search && typeof search === 'string') {
    const term = search.trim();
    if (term) {
      where.OR = [
        { slug: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }
  }

  return where;
};

const resolveSortOrder = (sort) => {
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
    case 'title':
    case 'status':
    case 'riskTier':
    case 'updatedAt':
    case 'domain':
      return { [field]: normalizedDirection };
    default:
      return { updatedAt: 'desc' };
  }
};

const listControlRecords = async ({
  limit = 25,
  offset = 0,
  filters = {},
  sort,
} = {}) =>
  prisma.control.findMany({
    where: buildWhereClause(filters),
    include: CONTROL_SUMMARY_INCLUDE,
    orderBy: resolveSortOrder(sort),
    take: limit,
    skip: offset,
  });

const countControlRecords = async (filters = {}) =>
  prisma.control.count({
    where: buildWhereClause(filters),
  });

const aggregateControlRecords = async () => {
  const [statusGroups, riskTierGroups, domainGroups] = await Promise.all([
    prisma.control.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.control.groupBy({
      by: ['riskTier'],
      _count: { _all: true },
    }),
    prisma.control.groupBy({
      by: ['domain'],
      _count: { _all: true },
    }),
  ]);

  return {
    status: statusGroups,
    riskTier: riskTierGroups,
    domain: domainGroups,
  };
};

const findControlById = async (controlId, { detail = false } = {}) => {
  if (!controlId) {
    return null;
  }

  return prisma.control.findUnique({
    where: { id: controlId },
    include: detail ? CONTROL_DETAIL_INCLUDE : CONTROL_SUMMARY_INCLUDE,
  });
};

const createControlRecord = async ({
  controlData,
  frameworkLinks = [],
  auditEvent,
}) =>
  prisma.$transaction(async (tx) => {
    const record = await tx.control.create({
      data: controlData,
    });

    if (frameworkLinks.length > 0) {
      await tx.controlFrameworkLink.createMany({
        data: frameworkLinks.map((link) => ({
          controlId: record.id,
          frameworkId: link.frameworkId ?? null,
          frameworkControlId: link.frameworkControlId ?? null,
          coverageLevel: link.coverageLevel ?? 'PARTIAL',
          status: link.status ?? 'ACTIVE',
          evidenceReferences: link.evidenceReferences ?? [],
          effectiveFrom: link.effectiveFrom ?? null,
          effectiveTo: link.effectiveTo ?? null,
          notes: link.notes ?? null,
          metadata: link.metadata ?? null,
        })),
      });
    }

    if (auditEvent) {
      await tx.controlAuditEvent.create({
        data: {
          controlId: record.id,
          ...auditEvent,
        },
      });
    }

    return tx.control.findUnique({
      where: { id: record.id },
      include: CONTROL_DETAIL_INCLUDE,
    });
  });

const updateControlRecord = async (
  controlId,
  { controlData, auditEvent } = {},
) =>
  prisma.$transaction(async (tx) => {
    const updated = await tx.control.update({
      where: { id: controlId },
      data: controlData,
    });

    if (auditEvent) {
      await tx.controlAuditEvent.create({
        data: {
          controlId: controlId,
          ...auditEvent,
        },
      });
    }

    return tx.control.findUnique({
      where: { id: updated.id },
      include: CONTROL_DETAIL_INCLUDE,
    });
  });

const archiveControlRecord = async (controlId, data = {}) =>
  prisma.control.update({
    where: { id: controlId },
    data,
    include: CONTROL_DETAIL_INCLUDE,
  });

const replaceFrameworkLinks = async ({ controlId, mappings = [] }) =>
  prisma.$transaction(async (tx) => {
    await tx.controlFrameworkLink.deleteMany({ where: { controlId } });

    if (mappings.length > 0) {
      await tx.controlFrameworkLink.createMany({
        data: mappings.map((mapping) => ({
          controlId,
          frameworkId: mapping.frameworkId ?? null,
          frameworkControlId: mapping.frameworkControlId ?? null,
          coverageLevel: mapping.coverageLevel ?? 'PARTIAL',
          status: mapping.status ?? 'ACTIVE',
          evidenceReferences: mapping.evidenceReferences ?? [],
          effectiveFrom: mapping.effectiveFrom ?? null,
          effectiveTo: mapping.effectiveTo ?? null,
          notes: mapping.notes ?? null,
          metadata: mapping.metadata ?? null,
        })),
      });
    }

    return tx.control.findUnique({
      where: { id: controlId },
      include: CONTROL_DETAIL_INCLUDE,
    });
  });

const recordControlAuditEvent = async (event) => {
  if (!event?.controlId) {
    return null;
  }

  try {
    return await prisma.controlAuditEvent.create({
      data: event,
    });
  } catch (error) {
    logger.warn('Failed to persist control audit event', {
      error: error.message,
      controlId: event.controlId,
    });
    return null;
  }
};

const listFrameworkControlsByIds = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  return prisma.frameworkControl.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      frameworkId: true,
      code: true,
      title: true,
      status: true,
    },
  });
};

const listFrameworksByIds = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  return prisma.framework.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
    },
  });
};

const listControlScores = async ({ controlId, granularity, limit = 12 }) =>
  prisma.controlScore.findMany({
    where: {
      controlId,
      granularity,
    },
    orderBy: { windowStart: 'desc' },
    take: limit,
  });

const upsertControlScores = async (snapshots = []) => {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return [];
  }

  return prisma.$transaction(
    snapshots.map((snapshot) =>
      prisma.controlScore.upsert({
        where: {
          controlId_granularity_windowStart: {
            controlId: snapshot.controlId,
            granularity: snapshot.granularity,
            windowStart: snapshot.windowStart,
          },
        },
        update: {
          windowEnd: snapshot.windowEnd,
          score: snapshot.score,
          classification: snapshot.classification,
          sampleSize: snapshot.sampleSize ?? 0,
          numerator: snapshot.numerator ?? 0,
          denominator: snapshot.denominator ?? 0,
          metadata: snapshot.metadata ?? null,
        },
        create: {
          controlId: snapshot.controlId,
          granularity: snapshot.granularity,
          windowStart: snapshot.windowStart,
          windowEnd: snapshot.windowEnd,
          score: snapshot.score,
          classification: snapshot.classification,
          sampleSize: snapshot.sampleSize ?? 0,
          numerator: snapshot.numerator ?? 0,
          denominator: snapshot.denominator ?? 0,
          metadata: snapshot.metadata ?? null,
        },
      }),
    ),
  );
};

const listControlCheckLinks = async (controlId) =>
  prisma.checkControlLink.findMany({
    where: { controlId },
    select: {
      id: true,
      checkId: true,
      weight: true,
      enforcementLevel: true,
      assertionType: true,
      frequencyCadence: true,
    },
  });

const listCheckResultsForControl = async ({
  controlId,
  checkIds,
  since,
}) => {
  if (!Array.isArray(checkIds) || checkIds.length === 0) {
    return [];
  }

  return prisma.checkResult.findMany({
    where: {
      checkId: { in: checkIds },
      executedAt: since ? { gte: since } : undefined,
      publicationState: { in: ['VALIDATED', 'PUBLISHED'] },
      status: { in: ['PASS', 'FAIL', 'WARNING', 'ERROR'] },
      OR: [{ controlId }, { controlId: null }],
    },
    select: {
      id: true,
      checkId: true,
      status: true,
      executedAt: true,
      controlId: true,
    },
    orderBy: { executedAt: 'desc' },
  });
};

const getControlScoringContext = async (controlId) =>
  prisma.control.findUnique({
    where: { id: controlId },
    select: {
      id: true,
      slug: true,
      riskTier: true,
      status: true,
    },
  });

module.exports = {
  aggregateControlRecords,
  archiveControlRecord,
  countControlRecords,
  createControlRecord,
  findControlById,
  getControlScoringContext,
  listCheckResultsForControl,
  listControlCheckLinks,
  listControlRecords,
  listControlScores,
  listFrameworkControlsByIds,
  listFrameworksByIds,
  recordControlAuditEvent,
  replaceFrameworkLinks,
  updateControlRecord,
  upsertControlScores,
};
