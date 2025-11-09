const { z } = require('zod');

const { createLogger } = require('@/utils/logger');
const {
  createValidationError,
  createNotFoundError,
} = require('@/utils/errors');
const { findCheckById, updateCheckRecord } = require('../repositories/checks.repository');
const {
  findResultById,
  updateResultRecord,
} = require('../repositories/results.repository');
const {
  findReviewQueueItemById,
  updateReviewQueueItem,
} = require('../repositories/review-queue.repository');
const { publishCheckPublished } = require('../events/check.published');
const { serializeCheck } = require('./checks.service');
const { serializeResult } = require('./execution.service');

const logger = createLogger('governance-lifecycle-service');

const PUBLISH_SCHEMA = z
  .object({
    severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    notes: z.string().max(4000).optional(),
  })
  .optional();

const REVIEW_COMPLETION_SCHEMA = z.object({
  status: z.enum(['PASS', 'FAIL', 'WARNING', 'PENDING_REVIEW', 'ERROR']).optional(),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  notes: z.string().max(4000).optional(),
  decision: z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']).optional(),
  publish: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  evidenceBundleId: z.string().optional(),
});

const activateCheckDefinition = async ({ checkId, actorId }) => {
  const check = await findCheckById(checkId);
  if (!check) {
    throw createNotFoundError('Check definition not found', { checkId });
  }

  if (check.status !== 'READY_FOR_VALIDATION') {
    throw createValidationError('Checks must be marked as ready before activation', {
      status: check.status,
    });
  }

  const now = new Date();
  const updated = await updateCheckRecord(checkId, {
    status: 'ACTIVE',
    readyAt: check.readyAt ?? now,
    updatedBy: actorId ?? null,
  });

  logger.info('Check activated', { checkId, actorId });
  return serializeCheck(updated);
};

const publishResult = async ({ resultId, actorId, payload }) => {
  const parsed = PUBLISH_SCHEMA.parse(payload);
  const result = await findResultById(resultId);
  if (!result) {
    throw createNotFoundError('Result not found', { resultId });
  }

  if (!result.check) {
    throw createValidationError('Results must be associated with a check before publishing');
  }

  if (result.publicationState === 'PUBLISHED') {
    throw createValidationError('Result already published');
  }

  const now = new Date();
  const updated = await updateResultRecord(resultId, {
    severity: parsed?.severity ?? result.severity,
    notes: parsed?.notes ?? result.notes,
    publicationState: 'PUBLISHED',
    publishedAt: now,
    validatedAt: result.validatedAt ?? now,
  });

  if (updated.reviewQueueItem && updated.reviewQueueItem.state !== 'COMPLETED') {
    await updateReviewQueueItem(updated.reviewQueueItem.id, {
      state: 'COMPLETED',
      completedAt: now,
    });
  }

  publishCheckPublished({
    checkId: updated.checkId,
    resultId: updated.id,
    severity: updated.severity,
    publishedAt: now.toISOString(),
    actorId: actorId ?? null,
  });

  return serializeResult(updated);
};

const completeReviewTask = async ({ itemId, payload, actorId }) => {
  const parsed = REVIEW_COMPLETION_SCHEMA.parse(payload ?? {});
  const queueItem = await findReviewQueueItemById(itemId);
  if (!queueItem) {
    throw createNotFoundError('Review queue item not found', { itemId });
  }

  if (!queueItem.resultId) {
    throw createValidationError('Review queue item is missing an associated result', { itemId });
  }

  if (queueItem.state === 'COMPLETED') {
    throw createValidationError('Review task already completed');
  }

  const result = await findResultById(queueItem.resultId);
  if (!result) {
    throw createNotFoundError('Result not found for review task', { resultId: queueItem.resultId });
  }

  const completionTime = new Date();
  const updatedQueue = await updateReviewQueueItem(itemId, {
    state: 'COMPLETED',
    completedAt: completionTime,
    acknowledgedAt: queueItem.acknowledgedAt ?? completionTime,
    evidenceBundleId: parsed.evidenceBundleId ?? queueItem.evidenceBundleId ?? null,
    metadata: {
      ...(queueItem.metadata ?? {}),
      reviewer: actorId ?? null,
      decision: parsed.decision ?? null,
      completedAt: completionTime.toISOString(),
      notes: parsed.notes ?? result.notes ?? null,
    },
  });

  const publicationState = parsed.publish ? 'PUBLISHED' : 'VALIDATED';
  const resultUpdate = await updateResultRecord(result.id, {
    status: parsed.status ?? result.status,
    severity: parsed.severity ?? result.severity,
    notes: parsed.notes ?? result.notes,
    publicationState,
    validatedAt: completionTime,
    publishedAt: parsed.publish ? completionTime : result.publishedAt,
  });

  if (publicationState === 'PUBLISHED') {
    publishCheckPublished({
      checkId: resultUpdate.checkId,
      resultId: resultUpdate.id,
      severity: resultUpdate.severity,
      publishedAt: completionTime.toISOString(),
      actorId: actorId ?? null,
    });
  }

  return {
    reviewTask: {
      id: updatedQueue.id,
      state: updatedQueue.state,
      completedAt: updatedQueue.completedAt,
      metadata: updatedQueue.metadata,
    },
    result: serializeResult(resultUpdate),
  };
};

module.exports = {
  activateCheckDefinition,
  completeReviewTask,
  publishResult,
};
