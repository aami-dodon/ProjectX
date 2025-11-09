const { z } = require('zod');
const { TaskPriority, TaskSource, TaskStatus } = require('@prisma/client');

const { createLogger } = require('@/utils/logger');
const { createValidationError, createNotFoundError } = require('@/utils/errors');
const {
  listTasks,
  countTasks,
  findTaskById,
  createTaskRecord,
  updateTaskRecord,
  getTaskSummary,
  createTaskEvent,
  listTaskEvents,
} = require('../repositories/task.repository');
const {
  createAssignmentRecord,
  revokeAssignmentsForTask,
  findAssignmentById,
  revokeAssignmentRecord,
} = require('../repositories/task-assignment.repository');
const {
  upsertTaskMetrics,
  recordStatusDuration,
  getSlaDashboardMetrics,
} = require('../repositories/task-metric.repository');
const {
  defaultInitialStatus,
  ensureLifecycleTransition,
  getLifecycleTimestamps,
  shouldQueueVerification,
} = require('./lifecycle.service');
const { deriveSlaState } = require('./escalation.service');
const { linkEvidenceToTask } = require('./evidence-sync.service');
const { queueVerificationRequest } = require('../workflows/verification.queue');
const { enqueueSyncRequest } = require('../workflows/sync.processor');
const { publishTaskCreated } = require('../events/task.created');
const { publishTaskUpdated } = require('../events/task.updated');
const { publishTaskClosed } = require('../events/task.closed');

const logger = createLogger('tasks-service');

const LIST_SCHEMA = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.string().optional(),
});

const dateCoerce = z.preprocess((value) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}, z.date());

const CREATE_TASK_SCHEMA = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(4000).optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).optional(),
  source: z.nativeEnum(TaskSource).default(TaskSource.MANUAL),
  controlId: z.string().uuid().optional(),
  checkId: z.string().uuid().optional(),
  frameworkId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  teamId: z.string().max(120).optional(),
  slaDueAt: dateCoerce.optional(),
  delegationExpiresAt: dateCoerce.optional(),
  verificationRequired: z.boolean().optional(),
  externalIssueKey: z.string().max(255).optional(),
  externalProvider: z.string().max(120).optional(),
});

const UPDATE_TASK_SCHEMA = CREATE_TASK_SCHEMA.partial().extend({
  status: z.nativeEnum(TaskStatus).optional(),
});

const ASSIGNMENT_SCHEMA = z
  .object({
    assigneeId: z.string().uuid().optional(),
    teamId: z.string().max(120).optional(),
    delegationExpiresAt: dateCoerce.optional(),
    justification: z.string().max(2000).optional(),
  })
  .refine((value) => value.assigneeId || value.teamId, {
    message: 'Either assigneeId or teamId must be provided',
    path: ['assigneeId'],
  });

const EVIDENCE_SCHEMA = z.object({
  evidenceIds: z.array(z.string().uuid()).nonempty(),
  linkType: z.string().max(120).optional(),
});

const SYNC_SCHEMA = z.object({
  provider: z.enum(['jira', 'servicenow']).optional(),
  externalIssueKey: z.string().max(255).optional(),
  payload: z.record(z.any()).optional(),
});

const normalizeFilterValue = (filters, key) =>
  filters?.[key] ?? filters?.[`${key}s`];

const stringifyUser = (user) =>
  (user
    ? {
        id: user.id,
        name: user.fullName ?? user.email,
        email: user.email,
      }
    : null);

const serializeAssignments = (assignments = []) =>
  assignments.map((assignment) => ({
    id: assignment.id,
    assignee: stringifyUser(assignment.assignee),
    teamId: assignment.teamId ?? null,
    delegatedBy: stringifyUser(assignment.delegatedBy),
    delegationExpiresAt: assignment.delegationExpiresAt,
    justification: assignment.justification ?? null,
    createdAt: assignment.createdAt,
    revokedAt: assignment.revokedAt,
  }));

const serializeEvidence = (links = []) =>
  links.map((link) => ({
    id: link.id,
    evidenceId: link.evidenceId,
    linkType: link.linkType ?? 'ATTACHMENT',
    verificationStatus: link.verificationStatus,
    verifiedAt: link.verifiedAt,
    createdAt: link.createdAt,
    reviewer: stringifyUser(link.reviewer),
    evidence: link.evidence
      ? {
          id: link.evidence.id,
          displayName: link.evidence.displayName,
          description: link.evidence.description,
        }
      : null,
  }));

const serializeEvents = (events = []) =>
  events.map((event) => ({
    id: event.id,
    type: event.eventType,
    createdAt: event.createdAt,
    actor: stringifyUser(event.actor) || (event.actorType ? { id: null, name: event.actorType } : null),
    payload: event.payload ?? {},
  }));

const serializeTask = (record, { detailed = false } = {}) => {
  if (!record) {
    return null;
  }

  const slaState = deriveSlaState(record);

  const base = {
    id: record.id,
    title: record.title,
    description: record.description ?? null,
    priority: record.priority,
    status: record.status,
    source: record.source,
    control: record.control
      ? {
          id: record.control.id,
          title: record.control.title,
          slug: record.control.slug,
        }
      : null,
    check: record.check
      ? {
          id: record.check.id,
          name: record.check.name,
          severity: record.check.severityDefault,
        }
      : null,
    framework: record.framework
      ? {
          id: record.framework.id,
          title: record.framework.title,
          slug: record.framework.slug,
        }
      : null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    resolvedAt: record.resolvedAt,
    closedAt: record.closedAt,
    slaDueAt: record.slaDueAt,
    escalationLevel: record.escalationLevel,
    verificationRequired: record.verificationRequired,
    verificationCompletedAt: record.verificationCompletedAt,
    externalSync: record.externalProvider
      ? {
          provider: record.externalProvider,
          issueKey: record.externalIssueKey ?? null,
        }
      : null,
    owner: stringifyUser(record.assignee),
    createdBy: stringifyUser(record.createdBy),
    teamId: record.teamId ?? null,
    delegationExpiresAt: record.delegationExpiresAt ?? null,
    metrics: record.metrics ?? null,
    slaState,
  };

  if (!detailed) {
    return base;
  }

  return {
    ...base,
    assignments: serializeAssignments(record.assignments),
    timeline: serializeEvents(record.events),
    evidence: serializeEvidence(record.evidenceLinks),
  };
};

const formatSummaryGroup = (groups = [], field) =>
  groups.reduce((acc, group) => {
    if (!group || group[field] === undefined || group[field] === null) {
      return acc;
    }

    acc[group[field]] = group?._count?._all ?? 0;
    return acc;
  }, {});

const listTaskRecords = async (filters = {}) => {
  const parsed = LIST_SCHEMA.parse(filters);
  const repoFilters = {
    limit: parsed.limit,
    offset: parsed.offset,
    sort: parsed.sort,
    statuses: normalizeFilterValue(filters, 'status'),
    priorities: normalizeFilterValue(filters, 'priority'),
    assigneeIds: normalizeFilterValue(filters, 'assigneeId'),
    teamIds: normalizeFilterValue(filters, 'teamId'),
    frameworkIds: normalizeFilterValue(filters, 'frameworkId'),
    controlIds: normalizeFilterValue(filters, 'controlId'),
    checkIds: normalizeFilterValue(filters, 'checkId'),
    sources: normalizeFilterValue(filters, 'source'),
    escalationLevels: normalizeFilterValue(filters, 'escalationLevel'),
    search: filters.search,
    slaState: filters.slaState ?? filters.sla,
  };

  const [records, total, summary] = await Promise.all([
    listTasks(repoFilters),
    countTasks(repoFilters),
    getTaskSummary(repoFilters),
  ]);

  return {
    data: records.map((record) => serializeTask(record)),
    pagination: {
      total,
      limit: parsed.limit,
      offset: parsed.offset,
    },
    summary: {
      status: formatSummaryGroup(summary.status, 'status'),
      priority: formatSummaryGroup(summary.priority, 'priority'),
      escalation: formatSummaryGroup(summary.escalation, 'escalationLevel'),
      sla: summary.sla,
    },
  };
};

const getTaskDetail = async (taskId) => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw createNotFoundError('Task not found', { taskId });
  }

  return serializeTask(task, { detailed: true });
};

const createTask = async ({ payload, actorId }) => {
  const parsed = CREATE_TASK_SCHEMA.parse(payload ?? {});
  const status = parsed.status ?? defaultInitialStatus;

  const task = await createTaskRecord({
    title: parsed.title,
    description: parsed.description ?? null,
    priority: parsed.priority,
    status,
    source: parsed.source,
    controlId: parsed.controlId ?? null,
    checkId: parsed.checkId ?? null,
    frameworkId: parsed.frameworkId ?? null,
    assigneeId: parsed.assigneeId ?? null,
    teamId: parsed.teamId ?? null,
    createdById: actorId ?? null,
    slaDueAt: parsed.slaDueAt ?? null,
    delegationExpiresAt: parsed.delegationExpiresAt ?? null,
    verificationRequired: parsed.verificationRequired ?? true,
    externalIssueKey: parsed.externalIssueKey ?? null,
    externalProvider: parsed.externalProvider ?? null,
  });

  await createTaskEvent({
    taskId: task.id,
    eventType: 'TASK_CREATED',
    actorId: actorId ?? null,
    payload: {
      priority: task.priority,
      status: task.status,
    },
  });

  await upsertTaskMetrics(task.id, {});

  if (parsed.assigneeId) {
    await revokeAssignmentsForTask(task.id);
    await createAssignmentRecord({
      taskId: task.id,
      assigneeId: parsed.assigneeId,
      teamId: parsed.teamId ?? null,
      delegatedById: actorId ?? null,
      delegationExpiresAt: parsed.delegationExpiresAt ?? null,
    });
  }

  const refreshed = await findTaskById(task.id);

  publishTaskCreated(refreshed);
  logger.info('Created remediation task', { taskId: task.id, creator: actorId });

  return serializeTask(refreshed, { detailed: true });
};

const updateTask = async ({ taskId, payload, actorId }) => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw createNotFoundError('Task not found', { taskId });
  }

  const parsed = UPDATE_TASK_SCHEMA.parse(payload ?? {});
  const updates = {};
  const now = new Date();

  if (parsed.status && parsed.status !== task.status) {
    ensureLifecycleTransition(task.status, parsed.status);
    Object.assign(
      updates,
      {
        status: parsed.status,
      },
      getLifecycleTimestamps({ currentStatus: task.status, nextStatus: parsed.status, now }),
    );

    const minutesInPreviousStatus = Math.max(
      0,
      Math.floor((now.getTime() - new Date(task.updatedAt).getTime()) / 60000),
    );
    if (minutesInPreviousStatus > 0) {
      await recordStatusDuration({
        taskId: task.id,
        status: task.status,
        minutes: minutesInPreviousStatus,
      });
    }

    const metricsUpdates = {};
    const elapsedMinutes = Math.max(
      1,
      Math.floor((now.getTime() - new Date(task.createdAt).getTime()) / 60000),
    );
    if (
      !task.metrics?.timeToAcknowledge &&
      ['IN_PROGRESS', 'AWAITING_EVIDENCE', 'PENDING_VERIFICATION', 'RESOLVED', 'CLOSED'].includes(parsed.status)
    ) {
      metricsUpdates.timeToAcknowledge = elapsedMinutes;
    }

    if (parsed.status === TaskStatus.CLOSED) {
      metricsUpdates.timeToClose = elapsedMinutes;
    }

    if (Object.keys(metricsUpdates).length > 0) {
      await upsertTaskMetrics(task.id, metricsUpdates);
    }
  }

  if (parsed.priority) {
    updates.priority = parsed.priority;
  }

  if (parsed.description !== undefined) {
    updates.description = parsed.description ?? null;
  }

  if (parsed.slaDueAt !== undefined) {
    updates.slaDueAt = parsed.slaDueAt ?? null;
  }

  if (parsed.teamId !== undefined) {
    updates.teamId = parsed.teamId ?? null;
  }

  if (parsed.delegationExpiresAt !== undefined) {
    updates.delegationExpiresAt = parsed.delegationExpiresAt ?? null;
  }

  if (parsed.verificationRequired !== undefined) {
    updates.verificationRequired = parsed.verificationRequired;
  }

  if (parsed.externalIssueKey !== undefined) {
    updates.externalIssueKey = parsed.externalIssueKey ?? null;
  }

  if (parsed.externalProvider !== undefined) {
    updates.externalProvider = parsed.externalProvider ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return serializeTask(task, { detailed: true });
  }

  const updated = await updateTaskRecord(task.id, updates);

  await createTaskEvent({
    taskId: task.id,
    eventType: parsed.status ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED',
    actorId: actorId ?? null,
    payload: {
      from: parsed.status ? task.status : undefined,
      to: parsed.status ?? undefined,
      changes: Object.keys(updates),
    },
  });

  if (parsed.status && shouldQueueVerification(parsed.status, updated.verificationRequired)) {
    queueVerificationRequest({
      taskId: updated.id,
      requestedBy: actorId ?? null,
    });
  }

  if (parsed.status === TaskStatus.CLOSED) {
    publishTaskClosed(updated);
  } else {
    publishTaskUpdated(updated);
  }

  return serializeTask(updated, { detailed: true });
};

const assignTask = async ({ taskId, payload, actorId }) => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw createNotFoundError('Task not found', { taskId });
  }

  const parsed = ASSIGNMENT_SCHEMA.parse(payload ?? {});
  await revokeAssignmentsForTask(taskId);

  await createAssignmentRecord({
    taskId,
    assigneeId: parsed.assigneeId ?? null,
    teamId: parsed.teamId ?? null,
    delegatedById: actorId ?? null,
    delegationExpiresAt: parsed.delegationExpiresAt ?? null,
    justification: parsed.justification ?? null,
  });

  const updated = await updateTaskRecord(taskId, {
    assigneeId: parsed.assigneeId ?? null,
    teamId: parsed.teamId ?? null,
    delegationExpiresAt: parsed.delegationExpiresAt ?? null,
  });

  await createTaskEvent({
    taskId,
    eventType: 'TASK_ASSIGNED',
    actorId: actorId ?? null,
    payload: {
      assigneeId: parsed.assigneeId ?? null,
      teamId: parsed.teamId ?? null,
    },
  });

  publishTaskUpdated(updated);

  return serializeTask(updated, { detailed: true });
};

const revokeAssignment = async ({ assignmentId, actorId }) => {
  const assignment = await findAssignmentById(assignmentId);
  if (!assignment) {
    throw createNotFoundError('Assignment not found', { assignmentId });
  }

  await revokeAssignmentRecord(assignmentId, { revokedAt: new Date() });
  await createTaskEvent({
    taskId: assignment.taskId,
    eventType: 'TASK_ASSIGNMENT_REVOKED',
    actorId: actorId ?? null,
    payload: {
      assignmentId,
    },
  });

  const task = await findTaskById(assignment.taskId);
  return serializeTask(task, { detailed: true });
};

const attachEvidence = async ({ taskId, payload, actorId }) => {
  const data = EVIDENCE_SCHEMA.parse(payload ?? {});
  const result = await linkEvidenceToTask({
    taskId,
    evidenceIds: data.evidenceIds,
    linkType: data.linkType,
    actorId,
  });

  publishTaskUpdated(result.task);
  return serializeEvidence(result.evidence);
};

const syncTaskWithProvider = async ({ taskId, payload, actorId }) => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw createNotFoundError('Task not found', { taskId });
  }

  const parsed = SYNC_SCHEMA.parse(payload ?? {});
  const provider = parsed.provider ?? task.externalProvider;
  if (!provider) {
    throw createValidationError('provider is required to sync the task');
  }

  await enqueueSyncRequest({
    taskId,
    provider,
    actorId: actorId ?? null,
    payload: parsed.payload ?? {},
    externalIssueKey: parsed.externalIssueKey ?? task.externalIssueKey ?? null,
  });

  await createTaskEvent({
    taskId,
    eventType: 'TASK_SYNC_REQUESTED',
    actorId: actorId ?? null,
    payload: {
      provider,
      externalIssueKey: parsed.externalIssueKey ?? task.externalIssueKey ?? null,
    },
  });

  return { status: 'queued', provider, taskId };
};

const getTaskTimeline = async ({ taskId, limit = 100 }) => {
  const task = await findTaskById(taskId, { includeTimeline: false });
  if (!task) {
    throw createNotFoundError('Task not found', { taskId });
  }

  const events = await listTaskEvents(taskId, limit);
  return serializeEvents(events);
};

const getTaskSlaSummary = async () => getSlaDashboardMetrics();

module.exports = {
  assignTask,
  attachEvidence,
  createTask,
  getTaskDetail,
  getTaskSlaSummary,
  getTaskTimeline,
  listTaskRecords,
  revokeAssignment,
  serializeTask,
  syncTaskWithProvider,
  updateTask,
};
