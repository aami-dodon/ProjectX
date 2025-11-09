const { prisma } = require('@/integrations/prisma');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('reports-dashboards-repository');

const ACTIVE_CONTROL_STATUSES = ['ACTIVE', 'DRAFT'];
const OPEN_TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'AWAITING_EVIDENCE', 'PENDING_VERIFICATION'];

const loadFrameworkScoreData = async ({ frameworkIds = [], domain, granularity = 'DAILY', currentRange, previousRange }) => {
  const frameworkWhere = {
    status: { not: 'RETIRED' },
    ...(frameworkIds.length ? { id: { in: frameworkIds } } : {}),
    ...(domain ? { domain } : {}),
  };

  const frameworks = await prisma.framework.findMany({
    where: frameworkWhere,
    select: {
      id: true,
      slug: true,
      title: true,
      domain: true,
      publisher: true,
    },
    orderBy: { title: 'asc' },
  });

  if (!frameworks.length) {
    return {
      frameworks: [],
      controlLinks: [],
      currentScores: [],
      previousScores: [],
      evidenceCounts: [],
    };
  }

  const linkWhere = {
    frameworkId: { in: frameworks.map((framework) => framework.id) },
    status: 'ACTIVE',
    control: domain
      ? {
          is: {
            domain,
          },
        }
      : undefined,
  };

  const controlLinks = await prisma.controlFrameworkLink.findMany({
    where: linkWhere,
    select: {
      frameworkId: true,
      controlId: true,
      coverageLevel: true,
      control: {
        select: {
          id: true,
          slug: true,
          title: true,
          domain: true,
          riskTier: true,
          ownerTeam: true,
          status: true,
        },
      },
    },
  });

  const controlIds = Array.from(
    new Set(
      controlLinks
        .map((entry) => entry.controlId)
        .filter(Boolean),
    ),
  );

  let currentScores = [];
  let previousScores = [];
  let evidenceCounts = [];

  if (controlIds.length) {
    const scoreWhere = {
      controlId: { in: controlIds },
      granularity,
      ...(currentRange?.start || currentRange?.end
        ? {
            windowStart: {
              ...(currentRange?.start ? { gte: currentRange.start } : {}),
              ...(currentRange?.end ? { lt: currentRange.end } : {}),
            },
          }
        : {}),
    };

    currentScores = await prisma.controlScore.groupBy({
      by: ['controlId'],
      where: scoreWhere,
      _avg: { score: true },
      _count: { _all: true },
    });

    previousScores = previousRange
      ? await prisma.controlScore.groupBy({
          by: ['controlId'],
          where: {
            controlId: { in: controlIds },
            granularity,
            windowStart: {
              ...(previousRange.start ? { gte: previousRange.start } : {}),
              ...(previousRange.end ? { lt: previousRange.end } : {}),
            },
          },
          _avg: { score: true },
          _count: { _all: true },
        })
      : [];

    evidenceCounts = await prisma.evidenceLink.groupBy({
      by: ['controlId'],
      where: {
        controlId: { in: controlIds },
      },
      _count: { _all: true },
    });
  }

  return {
    frameworks,
    controlLinks,
    currentScores,
    previousScores,
    evidenceCounts,
  };
};

const loadControlHealthData = async ({ domain, ownerTeam, riskTier, limit, scoreRange }) => {
  const controlWhere = {
    status: { in: ACTIVE_CONTROL_STATUSES },
    ...(domain ? { domain } : {}),
    ...(ownerTeam ? { ownerTeam } : {}),
    ...(riskTier ? { riskTier } : {}),
  };

  const controls = await prisma.control.findMany({
    where: controlWhere,
    select: {
      id: true,
      slug: true,
      title: true,
      domain: true,
      riskTier: true,
      ownerTeam: true,
      status: true,
      updatedAt: true,
    },
    take: limit ?? undefined,
    orderBy: [{ riskTier: 'desc' }, { updatedAt: 'desc' }],
  });

  const controlIds = controls.map((control) => control.id);

  const scoreSnapshots = controlIds.length
    ? await prisma.controlScore.groupBy({
        by: ['controlId'],
        where: {
          controlId: { in: controlIds },
          ...(scoreRange?.start || scoreRange?.end
            ? {
                windowStart: {
                  ...(scoreRange?.start ? { gte: scoreRange.start } : {}),
                  ...(scoreRange?.end ? { lt: scoreRange.end } : {}),
                },
              }
            : {}),
        },
        _avg: { score: true },
        _count: { _all: true },
      })
    : [];

  const taskRecords = controlIds.length
    ? await prisma.task.findMany({
        where: {
          controlId: { in: controlIds },
          status: { in: OPEN_TASK_STATUSES },
        },
        select: {
          id: true,
          controlId: true,
          status: true,
          slaDueAt: true,
          escalationLevel: true,
        },
      })
    : [];

  return {
    controls,
    scoreSnapshots,
    taskRecords,
  };
};

const loadRemediationData = async ({ since }) => {
  const statusGroups = await prisma.task.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  const openTasks = await prisma.task.findMany({
    where: {
      status: { in: OPEN_TASK_STATUSES },
    },
    select: {
      id: true,
      status: true,
      controlId: true,
      teamId: true,
      slaDueAt: true,
      escalationLevel: true,
      createdAt: true,
    },
  });

  const throughputWindow = since ?? new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
  const recentClosures = await prisma.task.findMany({
    where: {
      resolvedAt: { gte: throughputWindow },
    },
    select: {
      id: true,
      resolvedAt: true,
      createdAt: true,
    },
  });

  const slaMetrics = await prisma.taskSlaMetric.findMany({
    where: {
      task: {
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
      updatedAt: { gte: throughputWindow },
    },
    select: {
      id: true,
      timeToClose: true,
      breachCount: true,
      lastBreachAt: true,
    },
  });

  return {
    statusGroups,
    openTasks,
    recentClosures,
    slaMetrics,
  };
};

const loadEvidenceData = async ({ freshnessThreshold }) => {
  const evidence = await prisma.evidence.findMany({
    select: {
      id: true,
      displayName: true,
      description: true,
      source: true,
      retentionState: true,
      retentionPolicyId: true,
      purgeScheduledFor: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      metadata: true,
      uploader: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 250,
  });

  const coverageLinks = await prisma.evidenceLink.groupBy({
    by: ['controlId'],
    where: {
      controlId: { not: null },
    },
    _count: { _all: true },
  });

  const totalControls = await prisma.control.count({
    where: { status: { not: 'DEPRECATED' } },
  });

  return {
    evidence,
    coverageLinks,
    controlCount: totalControls,
    freshnessThreshold,
  };
};

const persistMetricSnapshot = async ({ metricType, scope, filtersHash, windowStart, windowEnd, payload }) => {
  try {
    return await prisma.reportMetric.create({
      data: {
        metricType,
        scope,
        filtersHash,
        windowStart,
        windowEnd,
        payload,
      },
    });
  } catch (error) {
    logger.warn('Unable to persist reporting metric snapshot', {
      metricType,
      scope,
      error: error.message,
    });
    return null;
  }
};

module.exports = {
  loadControlHealthData,
  loadEvidenceData,
  loadFrameworkScoreData,
  loadRemediationData,
  persistMetricSnapshot,
};
