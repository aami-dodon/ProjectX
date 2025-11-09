const { prisma } = require('@/integrations/prisma');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('probe-repository');

const buildProbeWhere = ({ status, frameworkIds, owner, search } = {}) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (frameworkIds && frameworkIds.length > 0) {
    where.frameworkBindings = { hasSome: frameworkIds };
  }

  if (owner) {
    where.ownerEmail = { contains: owner, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
};

const listProbes = async ({ limit, offset, status, frameworkIds, owner, search }) =>
  prisma.probe.findMany({
    where: buildProbeWhere({ status, frameworkIds, owner, search }),
    include: {
      metrics: true,
      schedules: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      deployments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

const countProbes = async ({ status, frameworkIds, owner, search } = {}) =>
  prisma.probe.count({ where: buildProbeWhere({ status, frameworkIds, owner, search }) });

const createProbeRecord = async (data) => prisma.probe.create({ data });

const updateProbeRecord = async (id, data) =>
  prisma.probe.update({
    where: { id },
    data,
    include: {
      metrics: true,
      schedules: true,
      deployments: true,
    },
  });

const findProbeById = async (id) =>
  prisma.probe.findUnique({
    where: { id },
    include: {
      metrics: true,
      schedules: { orderBy: { createdAt: 'desc' } },
      deployments: { orderBy: { createdAt: 'desc' } },
      credentials: true,
    },
  });

const findProbeBySlug = async (slug) =>
  prisma.probe.findUnique({
    where: { slug },
    include: {
      metrics: true,
      schedules: { orderBy: { createdAt: 'desc' } },
      deployments: { orderBy: { createdAt: 'desc' } },
      credentials: true,
    },
  });

const findProbeByIdentifier = async (identifier) => {
  if (!identifier) {
    return null;
  }

  const probeById = await findProbeById(identifier);
  if (probeById) {
    return probeById;
  }

  return findProbeBySlug(identifier);
};

const createDeploymentRecord = async (probeId, payload) =>
  prisma.probeDeployment.create({
    data: {
      probeId,
      version: payload.version,
      environment: payload.environment,
      canaryPercent: payload.canaryPercent,
      status: payload.status,
      summary: payload.summary,
      manifest: payload.manifest,
      metadata: payload.metadata,
      selfTestSnapshot: payload.selfTestSnapshot,
      startedAt: payload.startedAt,
      completedAt: payload.completedAt,
      rolledBackAt: payload.rolledBackAt,
    },
  });

const listDeploymentsByProbe = async (probeId, limit = 50) =>
  prisma.probeDeployment.findMany({
    where: { probeId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

const createScheduleRecord = async (probeId, payload) =>
  prisma.probeSchedule.create({
    data: {
      probeId,
      type: payload.type,
      expression: payload.expression,
      priority: payload.priority,
      status: payload.status,
      controls: payload.controls,
      triggerMetadata: payload.triggerMetadata,
      metadata: payload.metadata,
      lastRunAt: payload.lastRunAt,
      nextRunAt: payload.nextRunAt,
    },
  });

const listSchedulesByProbe = async (probeId) =>
  prisma.probeSchedule.findMany({
    where: { probeId },
    orderBy: { createdAt: 'asc' },
  });

const upsertProbeMetrics = async (probeId, payload) =>
  prisma.probeMetric.upsert({
    where: { probeId },
    update: payload,
    create: {
      probeId,
      ...payload,
    },
  });

const getProbeMetrics = async (probeId) => prisma.probeMetric.findUnique({ where: { probeId } });

const recordProbeEvent = async (probeId, type, payload = null) =>
  prisma.probeEvent.create({ data: { probeId, type, payload } });

const touchLastDeployment = async (probeId, deployedAt) => {
  try {
    await prisma.probe.update({ where: { id: probeId }, data: { lastDeployedAt: deployedAt } });
  } catch (error) {
    logger.warn('Unable to update last deployment timestamp', { error: error.message, probeId });
  }
};

module.exports = {
  countProbes,
  createDeploymentRecord,
  createProbeRecord,
  createScheduleRecord,
  findProbeById,
  findProbeByIdentifier,
  getProbeMetrics,
  listDeploymentsByProbe,
  listProbes,
  listSchedulesByProbe,
  recordProbeEvent,
  touchLastDeployment,
  updateProbeRecord,
  upsertProbeMetrics,
};
