const { randomUUID } = require('crypto');

const { createLogger } = require('@/utils/logger');
const {
  createValidationError,
  createNotFoundError,
} = require('@/utils/errors');
const {
  findControlById,
  recordControlAuditEvent,
} = require('./repositories/control.repository');

const logger = createLogger('governance-control-lifecycle-service');

const triggerControlRemediation = async ({ controlId, payload = {}, actorId }) => {
  const control = await findControlById(controlId);
  if (!control) {
    throw createNotFoundError('Control not found', { controlId });
  }

  const reason = typeof payload.reason === 'string' ? payload.reason.trim() : '';
  if (!reason) {
    throw createValidationError('Remediation reason is required');
  }

  const priority = payload.priority ?? 'normal';
  const remediationTaskId = `task_${randomUUID()}`;
  const notificationId = `notification_${randomUUID()}`;

  await recordControlAuditEvent({
    controlId,
    actorId: actorId ?? null,
    action: 'CONTROL_REMEDIATION_TRIGGERED',
    changeSummary: 'Remediation workflow triggered',
    comment: reason,
    metadata: {
      remediationTaskId,
      notificationId,
      priority,
      reason,
    },
  });

  logger.info('Control remediation triggered', {
    controlId,
    actorId,
    remediationTaskId,
  });

  return {
    controlId,
    remediationTaskId,
    notificationId,
    priority,
  };
};

module.exports = {
  triggerControlRemediation,
};
