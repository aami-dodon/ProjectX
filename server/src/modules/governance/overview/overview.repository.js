const { prisma } = require('@/integrations/prisma');

const ACTIVE_CONTROL_STATUSES = ['ACTIVE', 'DEPRECATED'];
const ACTIVE_REVIEW_STATES = ['OPEN', 'IN_PROGRESS'];

const groupControlsByStatus = () =>
  prisma.control.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

const groupControlsByRiskTier = () =>
  prisma.control.groupBy({
    by: ['riskTier'],
    _count: { _all: true },
  });

const fetchControlSnapshots = (limit = 60) =>
  prisma.control.findMany({
    where: {
      status: { in: ACTIVE_CONTROL_STATUSES },
    },
    include: {
      frameworkLinks: {
        where: { status: 'ACTIVE' },
        take: 3,
        include: {
          framework: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      scores: {
        orderBy: { windowStart: 'desc' },
        take: 2,
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });

const fetchScoreTrend = ({ since, granularity = 'DAILY' } = {}) =>
  prisma.controlScore.groupBy({
    by: ['windowStart'],
    where: {
      granularity,
      windowStart: since ? { gte: since } : undefined,
    },
    _avg: { score: true },
    orderBy: { windowStart: 'asc' },
  });

const fetchFrameworkCoverage = async () => {
  const [totalFrameworks, coverageGroups] = await Promise.all([
    prisma.framework.count({
      where: { status: { not: 'RETIRED' } },
    }),
    prisma.controlFrameworkLink.groupBy({
      by: ['frameworkId'],
      where: {
        status: 'ACTIVE',
        frameworkId: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  const frameworkIds = coverageGroups
    .map((entry) => entry.frameworkId)
    .filter(Boolean);

  const frameworks = frameworkIds.length
    ? await prisma.framework.findMany({
        where: { id: { in: frameworkIds } },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
        },
      })
    : [];

  return {
    totalFrameworks,
    coverageGroups,
    frameworks,
  };
};

const fetchReviewQueueSnapshot = () => {
  const now = new Date();
  return Promise.all([
    prisma.reviewQueueItem.groupBy({
      by: ['state'],
      _count: { _all: true },
    }),
    prisma.reviewQueueItem.count({
      where: {
        state: { in: ACTIVE_REVIEW_STATES },
        dueAt: { lt: now },
      },
    }),
    prisma.reviewQueueItem.findMany({
      where: {
        state: { in: ACTIVE_REVIEW_STATES },
      },
      orderBy: [
        { priority: 'desc' },
        { dueAt: 'asc' },
      ],
      take: 5,
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
    }),
  ]).then(([stateGroups, overdueCount, urgentItems]) => ({
    stateGroups,
    overdueCount,
    urgentItems,
  }));
};

const fetchRecentRuns = (limit = 10) =>
  prisma.checkResult.findMany({
    where: {
      publicationState: { in: ['PENDING', 'VALIDATED', 'PUBLISHED'] },
    },
    orderBy: { executedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      status: true,
      severity: true,
      executedAt: true,
      publicationState: true,
      check: {
        select: {
          id: true,
          name: true,
        },
      },
      control: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

const fetchEvidenceControlLinks = (limit = 8) =>
  prisma.evidenceLink.findMany({
    where: { controlId: { not: null } },
    orderBy: { linkedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      linkedAt: true,
      role: true,
      metadata: true,
      control: {
        select: {
          id: true,
          title: true,
          slug: true,
          riskTier: true,
        },
      },
      check: {
        select: {
          id: true,
          name: true,
        },
      },
      evidence: {
        select: {
          id: true,
          displayName: true,
          source: true,
          retentionState: true,
          mimeType: true,
          size: true,
        },
      },
    },
  });

module.exports = {
  fetchControlSnapshots,
  fetchEvidenceControlLinks,
  fetchFrameworkCoverage,
  fetchRecentRuns,
  fetchReviewQueueSnapshot,
  fetchScoreTrend,
  groupControlsByRiskTier,
  groupControlsByStatus,
};
