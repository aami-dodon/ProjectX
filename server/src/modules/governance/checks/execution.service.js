const { z } = require('zod');

const {
  createValidationError,
  createNotFoundError,
} = require('@/utils/errors');
const {
  findCheckById,
  touchCheckRunMetadata,
} = require('../repositories/checks.repository');
const {
  listResults,
  countResults,
  createResultRecord,
} = require('../repositories/results.repository');
const {
  createReviewQueueItem,
} = require('../repositories/review-queue.repository');
const { calculateNextRunAt } = require('../schedulers/governance.scheduler');
const { publishCheckFailed } = require('../events/check.failed');

const RESULT_LIST_SCHEMA = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  statuses: z.array(z.string()).default([]),
  severities: z.array(z.string()).default([]),
  controlIds: z.array(z.string()).default([]),
  sort: z.string().optional(),
  published: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return undefined;
    }),
  from: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value) : undefined)),
  to: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value) : undefined)),
  search: z.string().optional(),
});

const RUN_SCHEMA = z.object({
  triggerSource: z.string().default('manual'),
  context: z.string().optional(),
  controlId: z.string().optional(),
  status: z.enum(['PASS', 'FAIL', 'WARNING', 'PENDING_REVIEW', 'ERROR']).optional(),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  evidenceLinkId: z.string().optional(),
  notes: z.string().max(4000).optional(),
  metadata: z.record(z.any()).optional(),
  requiresReview: z.boolean().optional(),
  review: z
    .object({
      assignedTo: z.string().optional(),
      dueAt: z
        .string()
        .optional()
        .transform((value) => (value ? new Date(value) : undefined)),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      evidenceBundleId: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    })
    .optional(),
});

const normalizeList = (value) => {
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

const serializeResult = (result) => ({
  id: result.id,
  checkId: result.checkId,
  controlId: result.controlId,
  status: result.status,
  severity: result.severity,
  notes: result.notes ?? null,
  metadata: result.metadata ?? {},
  evidenceLinkId: result.evidenceLinkId ?? null,
  executedAt: result.executedAt,
  validatedAt: result.validatedAt,
  publishedAt: result.publishedAt,
  publicationState: result.publicationState,
  createdBy: result.createdBy ?? null,
  reviewTask: result.reviewQueueItem
    ? {
        id: result.reviewQueueItem.id,
        state: result.reviewQueueItem.state,
        priority: result.reviewQueueItem.priority,
        assignedTo: result.reviewQueueItem.assignedTo,
        dueAt: result.reviewQueueItem.dueAt,
      }
    : null,
});

const getCheckResults = async (checkId, params = {}) => {
  const existing = await findCheckById(checkId);
  if (!existing) {
    throw createNotFoundError('Check definition not found', { checkId });
  }

  const parsed = RESULT_LIST_SCHEMA.parse({
    ...params,
    statuses: normalizeList(params.status ?? params.statuses),
    severities: normalizeList(params.severity ?? params.severities),
    controlIds: normalizeList(params.controlId ?? params.controlIds),
  });

  const filters = {
    checkId,
    statuses: parsed.statuses,
    severities: parsed.severities,
    controlIds: parsed.controlIds,
    published: parsed.published,
    from: parsed.from,
    to: parsed.to,
    sort: parsed.sort,
    search: parsed.search,
    limit: parsed.limit,
    offset: parsed.offset,
  };

  const [records, total] = await Promise.all([listResults(filters), countResults(filters)]);

  return {
    data: records.map(serializeResult),
    pagination: {
      total,
      limit: parsed.limit,
      offset: parsed.offset,
    },
  };
};

const runCheckExecution = async ({ checkId, payload, actorId }) => {
  const check = await findCheckById(checkId);
  if (!check) {
    throw createNotFoundError('Check definition not found', { checkId });
  }

  if (check.status === 'RETIRED') {
    throw createValidationError('Retired checks cannot be executed');
  }

  if (check.status !== 'ACTIVE') {
    throw createValidationError('Checks must be active before execution', {
      status: check.status,
    });
  }

  const parsed = RUN_SCHEMA.parse(payload ?? {});

  const resolvedStatus =
    parsed.status ||
    (check.type === 'AUTOMATED' ? 'PASS' : 'PENDING_REVIEW');

  const result = await createResultRecord({
    checkId,
    controlId:
      parsed.controlId ??
      (check.controlLinks && check.controlLinks.length > 0 ? check.controlLinks[0].controlId : null),
    status: resolvedStatus,
    severity: parsed.severity ?? check.severityDefault,
    evidenceLinkId: parsed.evidenceLinkId ?? null,
    notes: parsed.notes ?? null,
    metadata: parsed.metadata ?? {},
    runContext: parsed.context ?? null,
    triggerSource: parsed.triggerSource ?? 'manual',
    createdBy: actorId ?? null,
  });

  let reviewTask = null;
  const shouldQueueReview =
    parsed.requiresReview ||
    check.type !== 'AUTOMATED' ||
    resolvedStatus === 'PENDING_REVIEW';

  if (shouldQueueReview) {
    reviewTask = await createReviewQueueItem({
      checkId,
      resultId: result.id,
      assignedTo: parsed.review?.assignedTo ?? null,
      dueAt: parsed.review?.dueAt ?? null,
      priority: parsed.review?.priority ?? 'MEDIUM',
      evidenceBundleId: parsed.review?.evidenceBundleId ?? parsed.evidenceLinkId ?? null,
      metadata: parsed.review?.metadata ?? {},
      state: 'OPEN',
    });
  } else if (['FAIL', 'ERROR', 'WARNING'].includes(resolvedStatus)) {
    publishCheckFailed({
      checkId,
      resultId: result.id,
      severity: result.severity,
      status: result.status,
      triggeredBy: actorId ?? null,
    });
  }

  const lastRunAt = new Date();
  const nextRunAt = calculateNextRunAt(check.frequency, lastRunAt);
  await touchCheckRunMetadata(checkId, { lastRunAt, nextRunAt });

  return {
    result: serializeResult({
      ...result,
      reviewQueueItem: reviewTask,
    }),
    nextRunAt,
  };
};

module.exports = {
  getCheckResults,
  runCheckExecution,
  serializeResult,
};
