const { prisma } = require('@/integrations/prisma');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('evidence-repository');

const BASE_INCLUDE = {
  retentionPolicy: true,
  uploader: {
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  },
  links: {
    include: {
      control: {
        select: {
          id: true,
          title: true,
        },
      },
      check: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      linkedAt: 'desc',
    },
  },
};

const DETAIL_INCLUDE = {
  ...BASE_INCLUDE,
  events: {
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  },
  versions: {
    orderBy: {
      version: 'desc',
    },
    take: 10,
  },
};

const buildWhereClause = ({
  retentionState,
  source,
  controlId,
  checkId,
  uploaderId,
  tag,
  search,
} = {}) => {
  const where = {};

  if (retentionState) {
    where.retentionState = retentionState;
  }

  if (source) {
    where.source = source;
  }

  if (uploaderId) {
    where.uploaderId = uploaderId;
  }

  if (tag) {
    where.tags = {
      has: tag,
    };
  }

  const linkFilters = {};
  if (controlId) {
    linkFilters.controlId = controlId;
  }

  if (checkId) {
    linkFilters.checkId = checkId;
  }

  if (Object.keys(linkFilters).length > 0) {
    where.links = {
      some: linkFilters,
    };
  }

  if (search) {
    const trimmed = search.trim();
    if (trimmed) {
      where.OR = [
        { displayName: { contains: trimmed, mode: 'insensitive' } },
        { description: { contains: trimmed, mode: 'insensitive' } },
        { checksum: { contains: trimmed, mode: 'insensitive' } },
      ];
    }
  }

  return where;
};

const resolveOrderBy = (sort) => {
  if (!sort) {
    return { updatedAt: 'desc' };
  }

  const [field = 'updatedAt', direction = 'desc'] = sort.split(':');
  const normalizedField = field.trim();
  const normalizedDirection = direction.trim().toLowerCase() === 'asc' ? 'asc' : 'desc';

  switch (normalizedField) {
    case 'displayName':
    case 'createdAt':
    case 'updatedAt':
      return { [normalizedField]: normalizedDirection };
    default:
      return { updatedAt: 'desc' };
  }
};

const listEvidenceRecords = async ({ where, limit, offset, sort }) =>
  prisma.evidence.findMany({
    where,
    include: BASE_INCLUDE,
    take: limit,
    skip: offset,
    orderBy: resolveOrderBy(sort),
  });

const countEvidenceRecords = async (where) => prisma.evidence.count({ where });

const summarizeRetentionStates = async (where) => {
  const summary = await prisma.evidence.groupBy({
    by: ['retentionState'],
    _count: {
      _all: true,
    },
    where,
  });

  return summary.reduce((acc, entry) => {
    acc[entry.retentionState] = entry._count._all;
    return acc;
  }, {});
};

const findEvidenceById = async (id) =>
  prisma.evidence.findUnique({
    where: { id },
    include: DETAIL_INCLUDE,
  });

const createEvidenceRecord = async ({ data, linkInputs = [] }) => {
  return prisma.$transaction(async (tx) => {
    const record = await tx.evidence.create({ data });

    if (linkInputs.length > 0) {
      await tx.evidenceLink.createMany({
        data: linkInputs.map((link) => ({
          ...link,
          evidenceId: record.id,
        })),
        skipDuplicates: true,
      });
    }

    return tx.evidence.findUnique({
      where: { id: record.id },
      include: BASE_INCLUDE,
    });
  });
};

const updateEvidenceRecord = async ({ evidenceId, data, createVersion = false, actorId = null }) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.evidence.findUnique({ where: { id: evidenceId } });
    if (!existing) {
      return null;
    }

    if (createVersion) {
      await tx.evidenceVersion.create({
        data: {
          evidenceId,
          version: existing.version,
          checksum: existing.checksum,
          storageKey: existing.storageKey,
          size: existing.size,
          metadata: existing.metadata,
          createdBy: actorId,
        },
      });
      data.version = existing.version + 1;
    }

    await tx.evidence.update({
      where: { id: evidenceId },
      data,
    });

    return tx.evidence.findUnique({
      where: { id: evidenceId },
      include: DETAIL_INCLUDE,
    });
  });
};

const incrementDownloadCount = async (evidenceId) =>
  prisma.evidence.update({
    where: { id: evidenceId },
    data: {
      downloadCount: {
        increment: 1,
      },
    },
  });

const findRetentionPolicyById = (policyId) =>
  prisma.evidenceRetentionPolicy.findUnique({ where: { id: policyId } });

const ensureDefaultRetentionPolicy = async () => {
  const existingDefault = await prisma.evidenceRetentionPolicy.findFirst({
    where: { isDefault: true },
  });

  if (existingDefault) {
    return existingDefault;
  }

  const firstPolicy = await prisma.evidenceRetentionPolicy.findFirst();
  if (firstPolicy) {
    return firstPolicy;
  }

  logger.info('Creating default evidence retention policy');
  return prisma.evidenceRetentionPolicy.create({
    data: {
      name: 'Standard 36 Months',
      retentionMonths: 36,
      archiveAfterMonths: 30,
      isDefault: true,
      description: 'Default retention period aligned with regulatory guidance.',
    },
  });
};

const listRetentionPoliciesWithStats = () =>
  prisma.evidenceRetentionPolicy.findMany({
    include: {
      _count: {
        select: {
          evidence: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

const listUpcomingRetentionTransitions = ({ limit = 25 } = {}) =>
  prisma.evidence.findMany({
    where: {
      purgeScheduledFor: {
        not: null,
      },
    },
    orderBy: {
      purgeScheduledFor: 'asc',
    },
    take: limit,
    include: {
      retentionPolicy: true,
    },
  });

module.exports = {
  countEvidenceRecords,
  createEvidenceRecord,
  ensureDefaultRetentionPolicy,
  findEvidenceById,
  findRetentionPolicyById,
  incrementDownloadCount,
  listEvidenceRecords,
  listRetentionPoliciesWithStats,
  listUpcomingRetentionTransitions,
  summarizeRetentionStates,
  updateEvidenceRecord,
  buildWhereClause,
};
