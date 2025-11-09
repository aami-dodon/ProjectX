const { prisma } = require('@/integrations/prisma');

const ACTIVE_STATUSES = [
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_EVIDENCE',
  'PENDING_VERIFICATION',
];

const upsertTaskMetrics = async (taskId, updates = {}) => {
  if (!taskId) {
    return null;
  }

  return prisma.taskSlaMetric.upsert({
    where: { taskId },
    update: updates,
    create: {
      taskId,
      ...updates,
    },
  });
};

const recordStatusDuration = async ({ taskId, status, minutes }) => {
  if (!taskId || !status || !Number.isFinite(minutes)) {
    return null;
  }

  const current = await prisma.taskSlaMetric.findUnique({ where: { taskId } });
  const existing = current?.timeInStatus ?? {};
  const nextValue = Number(existing?.[status] ?? 0) + minutes;

  return prisma.taskSlaMetric.upsert({
    where: { taskId },
    update: {
      timeInStatus: {
        ...(existing || {}),
        [status]: nextValue,
      },
    },
    create: {
      taskId,
      timeInStatus: {
        [status]: nextValue,
      },
    },
  });
};

const incrementBreachCount = async (taskId, { timestamp = new Date() } = {}) => {
  if (!taskId) {
    return null;
  }

  return prisma.taskSlaMetric.upsert({
    where: { taskId },
    update: {
      breachCount: { increment: 1 },
      lastBreachAt: timestamp,
    },
    create: {
      taskId,
      breachCount: 1,
      lastBreachAt: timestamp,
    },
  });
};

const getSlaDashboardMetrics = async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [overdue, atRisk, activeTotal, breachAggregate, escalation] = await Promise.all([
    prisma.task.count({
      where: {
        status: { notIn: ['RESOLVED', 'CLOSED'] },
        slaDueAt: { not: null, lt: now },
      },
    }),
    prisma.task.count({
      where: {
        status: { in: ACTIVE_STATUSES.filter((status) => status !== 'DRAFT') },
        slaDueAt: { not: null, gt: now, lte: soon },
      },
    }),
    prisma.task.count({
      where: {
        status: { in: ACTIVE_STATUSES },
      },
    }),
    prisma.taskSlaMetric.aggregate({
      _avg: {
        timeToClose: true,
        timeToAcknowledge: true,
      },
      _sum: {
        breachCount: true,
      },
    }),
    prisma.task.groupBy({
      by: ['escalationLevel'],
      _count: { _all: true },
    }),
  ]);

  const byEscalationLevel = escalation.reduce((acc, entry) => {
    if (entry?.escalationLevel === undefined || entry?.escalationLevel === null) {
      return acc;
    }

    acc[entry.escalationLevel] = entry._count?._all ?? 0;
    return acc;
  }, {});

  return {
    overdue,
    atRisk,
    activeTotal,
    avgTimeToClose: breachAggregate?._avg?.timeToClose ?? null,
    avgTimeToAcknowledge: breachAggregate?._avg?.timeToAcknowledge ?? null,
    breachCount: breachAggregate?._sum?.breachCount ?? 0,
    byEscalationLevel,
  };
};

module.exports = {
  getSlaDashboardMetrics,
  incrementBreachCount,
  recordStatusDuration,
  upsertTaskMetrics,
};
