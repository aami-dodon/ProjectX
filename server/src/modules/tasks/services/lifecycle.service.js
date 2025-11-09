const { TaskStatus } = require('@prisma/client');
const { createValidationError } = require('@/utils/errors');

const STATUS_TRANSITIONS = {
  [TaskStatus.DRAFT]: [TaskStatus.OPEN],
  [TaskStatus.OPEN]: [TaskStatus.IN_PROGRESS, TaskStatus.AWAITING_EVIDENCE, TaskStatus.RESOLVED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.AWAITING_EVIDENCE, TaskStatus.PENDING_VERIFICATION, TaskStatus.RESOLVED],
  [TaskStatus.AWAITING_EVIDENCE]: [TaskStatus.IN_PROGRESS, TaskStatus.PENDING_VERIFICATION],
  [TaskStatus.PENDING_VERIFICATION]: [TaskStatus.RESOLVED, TaskStatus.IN_PROGRESS],
  [TaskStatus.RESOLVED]: [TaskStatus.CLOSED, TaskStatus.IN_PROGRESS],
  [TaskStatus.CLOSED]: [],
};

const ensureLifecycleTransition = (currentStatus, nextStatus) => {
  if (!nextStatus || currentStatus === nextStatus) {
    return;
  }

  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw createValidationError('Invalid lifecycle transition requested', {
      from: currentStatus,
      to: nextStatus,
    });
  }
};

const getLifecycleTimestamps = ({ currentStatus, nextStatus, now = new Date() } = {}) => {
  const updates = {};

  if (!nextStatus || currentStatus === nextStatus) {
    return updates;
  }

  if (nextStatus === TaskStatus.RESOLVED) {
    updates.resolvedAt = now;
    updates.closedAt = null;
  }

  if (nextStatus === TaskStatus.CLOSED) {
    updates.closedAt = now;
  }

  if (nextStatus === TaskStatus.IN_PROGRESS) {
    updates.resolvedAt = null;
    updates.closedAt = null;
  }

  if (nextStatus === TaskStatus.AWAITING_EVIDENCE) {
    updates.closedAt = null;
  }

  if (nextStatus === TaskStatus.PENDING_VERIFICATION) {
    updates.verificationCompletedAt = null;
  }

  if (nextStatus === TaskStatus.RESOLVED || nextStatus === TaskStatus.CLOSED) {
    updates.verificationCompletedAt = now;
  }

  return updates;
};

const shouldQueueVerification = (nextStatus, verificationRequired = true) =>
  verificationRequired && nextStatus === TaskStatus.PENDING_VERIFICATION;

const isTerminalStatus = (status) => status === TaskStatus.CLOSED;

const defaultInitialStatus = TaskStatus.OPEN;

module.exports = {
  defaultInitialStatus,
  ensureLifecycleTransition,
  getLifecycleTimestamps,
  isTerminalStatus,
  shouldQueueVerification,
};
