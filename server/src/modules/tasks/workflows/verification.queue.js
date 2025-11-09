const { createLogger } = require('@/utils/logger');

const logger = createLogger('tasks-verification-queue');

const verificationQueue = [];

const queueVerificationRequest = ({ taskId, requestedBy }) => {
  if (!taskId) {
    return { queued: false };
  }

  verificationQueue.push({
    taskId,
    requestedBy: requestedBy ?? null,
    enqueuedAt: new Date(),
  });

  logger.info('Queued task verification request', { taskId, queueDepth: verificationQueue.length });
  return { queued: true };
};

const processVerificationQueue = async (processor = async (job) => {
  logger.debug('Processed verification job (no-op)', { job });
}) => {
  while (verificationQueue.length > 0) {
    const job = verificationQueue.shift();
    try {
      await processor(job);
    } catch (error) {
      logger.error('Verification job failed', { taskId: job.taskId, error: error.message });
    }
  }
};

module.exports = {
  processVerificationQueue,
  queueVerificationRequest,
};
