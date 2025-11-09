const { prisma } = require('@/integrations/prisma');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('tasks-repository');

const ACTIVE_STATUSES = [
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_EVIDENCE',
  'PENDING_VERIFICATION',
];

const normalizeArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const buildWhereClause = ({
  statuses,
  priorities,
  assigneeIds,
  teamIds,
  frameworkIds,
  controlIds,
  checkIds,
  sources,
  escalationLevels,
  search,
  slaState,
} = {}) => {
  const where = {};

  const normalizedStatuses = normalizeArray(statuses).map((status) => status.toUpperCase());
  if (normalizedStatuses.length > 0) {
    where.status = { in: normalizedStatuses };
  }

  const normalizedPriority = normalizeArray(priorities).map((priority) => priority.toUpperCase());
  if (normalizedPriority.length > 0) {
    where.priority = { in: normalizedPriority };
  }

  const normalizedSources = normalizeArray(sources).map((source) => source.toUpperCase());
  if (normalizedSources.length > 0) {
    where.source = { in: normalizedSources };
  }

  const normalizedAssignees = normalizeArray(assigneeIds);
  if (normalizedAssignees.length > 0) {
    where.assigneeId = { in: normalizedAssignees };
  }

  const normalizedTeams = normalizeArray(teamIds);
  if (normalizedTeams.length > 0) {
    where.teamId = { in: normalizedTeams };
  }

  const normalizedFrameworks = normalizeArray(frameworkIds);
  if (normalizedFrameworks.length > 0) {
    where.frameworkId = { in: normalizedFrameworks };
  }

  const normalizedControlIds = normalizeArray(controlIds);
  if (normalizedControlIds.length > 0) {
    where.controlId = { in: normalizedControlIds };
  }

  const normalizedCheckIds = normalizeArray(checkIds);
  if (normalizedCheckIds.length > 0) {
    where.checkId = { in: normalizedCheckIds };
  }

  const normalizedEscalationLevels = normalizeArray(escalationLevels)
    .map((entry) => Number(entry))
    .filter(Number.isFinite);
  if (normalizedEscalationLevels.length > 0) {
    where.escalationLevel = { in: normalizedEscalationLevels };
  }

  if (search && typeof search === 'string') {
    const trimmed = search.trim();
    if (trimmed) {
      where.OR = [
        { title: { contains: trimmed, mode: 'insensitive' } },
        { description: { contains: trimmed, mode: 'insensitive' } },
        { externalIssueKey: { contains: trimmed, mode: 'insensitive' } },
      ];
    }
  }

  if (slaState === 'overdue') {
    where.AND = [
      ...(where.AND ?? []),
      {
        status: { notIn: ['RESOLVED', 'CLOSED'] },
        slaDueAt: { not: null, lt: new Date() },
      },
    ];
  }

  if (slaState === 'atRisk') {
    const now = new Date();
    const upcoming = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    where.AND = [
      ...(where.AND ?? []),
      {
        status: { in: ACTIVE_STATUSES.filter((status) => status !== 'DRAFT') },
        slaDueAt: { not: null, gt: now, lte: upcoming },
      },
    ];
  }

  return where;
};

const resolveOrderBy = (sort) => {
  if (!sort || typeof sort !== 'string') {
    return { updatedAt: 'desc' };
  }

  const [field, direction] = sort.split(':').map((entry) => entry.trim());
  const normalizedDirection = direction && direction.toLowerCase() === 'asc' ? 'asc' : 'desc';

  switch (field) {
    case 'title':
    case 'status':
    case 'priority':
    case 'createdAt':
    case 'updatedAt':
    case 'slaDueAt':
      return { [field]: normalizedDirection };
    case 'escalationLevel':
      return { escalationLevel: normalizedDirection };
    default:
      return { updatedAt: 'desc' };
  }
};

const ASSIGNEE_SELECT = {
  id: true,
  email: true,
  fullName: true,
};

const CONTROL_SELECT = {
  id: true,
  slug: true,
  title: true,
};

const CHECK_SELECT = {
  id: true,
  name: true,
  severityDefault: true,
};

const FRAMEWORK_SELECT = {
  id: true,
  slug: true,
  title: true,
};

const EVIDENCE_SELECT = {
  id: true,
  displayName: true,
  description: true,
  bucket: true,
  objectName: true,
  createdAt: true,
  uploaderId: true,
};

const TASK_LIST_INCLUDE = {
  assignee: { select: ASSIGNEE_SELECT },
  createdBy: { select: ASSIGNEE_SELECT },
  control: { select: CONTROL_SELECT },
  check: { select: CHECK_SELECT },
  framework: { select: FRAMEWORK_SELECT },
  metrics: true,
  assignments: {
    take: 1,
    orderBy: { createdAt: 'desc' },
  },
};

const TASK_DETAIL_INCLUDE = {
  ...TASK_LIST_INCLUDE,
  assignments: {
    orderBy: { createdAt: 'desc' },
  },
  events: {
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      actor: { select: ASSIGNEE_SELECT },
    },
  },
  evidenceLinks: {
    orderBy: { createdAt: 'desc' },
    include: {
      evidence: { select: EVIDENCE_SELECT },
      reviewer: { select: ASSIGNEE_SELECT },
    },
  },
};

const listTasks = async ({ limit = 25, offset = 0, sort, ...filters } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  return prisma.task.findMany({
    where: buildWhereClause(filters),
    include: TASK_LIST_INCLUDE,
    orderBy: resolveOrderBy(sort),
    take: safeLimit,
    skip: safeOffset,
  });
};

const countTasks = async (filters = {}) =>
  prisma.task.count({
    where: buildWhereClause(filters),
  });

const getTaskSummary = async (filters = {}) => {
  const where = buildWhereClause(filters);
  const now = new Date();
  const upcoming = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const composeWhere = (extra) => ({
    AND: [where, extra],
  });

  const [status, priority, escalation, overdueCount, atRiskCount] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      _count: { _all: true },
      where,
    }),
    prisma.task.groupBy({
      by: ['priority'],
      _count: { _all: true },
      where,
    }),
    prisma.task.groupBy({
      by: ['escalationLevel'],
      _count: { _all: true },
      where,
    }),
    prisma.task.count({
      where: composeWhere({
        status: { notIn: ['RESOLVED', 'CLOSED'] },
        slaDueAt: { not: null, lt: now },
      }),
    }),
    prisma.task.count({
      where: composeWhere({
        status: { in: ACTIVE_STATUSES.filter((status) => status !== 'DRAFT') },
        slaDueAt: { not: null, gt: now, lte: upcoming },
      }),
    }),
  ]);

  return {
    status,
    priority,
    escalation,
    sla: {
      overdue: overdueCount,
      atRisk: atRiskCount,
    },
  };
};

const findTaskById = async (id, { includeTimeline = true } = {}) =>
  prisma.task.findUnique({
    where: { id },
    include: includeTimeline ? TASK_DETAIL_INCLUDE : TASK_LIST_INCLUDE,
  });

const createTaskRecord = async (data = {}) => {
  const record = await prisma.task.create({ data });
  return findTaskById(record.id);
};

const updateTaskRecord = async (id, data = {}) => {
  const record = await prisma.task.update({
    where: { id },
    data,
  });

  return findTaskById(record.id);
};

const createTaskEvent = async ({ taskId, eventType, payload, actorId, actorType, origin }) =>
  prisma.taskEvent.create({
    data: {
      taskId,
      eventType,
      payload: payload ?? null,
      actorId: actorId ?? null,
      actorType: actorType ?? null,
      origin: origin ?? 'api',
    },
    include: {
      actor: { select: ASSIGNEE_SELECT },
    },
  });

const listTaskEvents = async (taskId, limit = 100) =>
  prisma.taskEvent.findMany({
    where: { taskId },
    include: {
      actor: { select: ASSIGNEE_SELECT },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

const attachEvidenceLinks = async ({ taskId, links = [] }) => {
  if (!taskId || !Array.isArray(links) || links.length === 0) {
    return [];
  }

  await prisma.taskEvidenceLink.createMany({
    data: links.map((link) => ({
      taskId,
      evidenceId: link.evidenceId,
      linkType: link.linkType ?? null,
      reviewerId: link.reviewerId ?? null,
      verificationStatus: link.verificationStatus ?? 'PENDING',
      verifiedAt: link.verifiedAt ?? null,
    })),
    skipDuplicates: true,
  });
  logger.debug('Attached evidence links', {
    taskId,
    linkCount: links.length,
  });

  return prisma.taskEvidenceLink.findMany({
    where: { taskId },
    include: {
      evidence: { select: EVIDENCE_SELECT },
      reviewer: { select: ASSIGNEE_SELECT },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findTasksPastSla = async ({ asOf = new Date() } = {}) =>
  prisma.task.findMany({
    where: {
      status: { notIn: ['RESOLVED', 'CLOSED'] },
      slaDueAt: { not: null, lte: asOf },
    },
    include: TASK_LIST_INCLUDE,
  });

module.exports = {
  attachEvidenceLinks,
  countTasks,
  createTaskEvent,
  createTaskRecord,
  findTaskById,
  findTasksPastSla,
  getTaskSummary,
  listTaskEvents,
  listTasks,
  updateTaskRecord,
};
