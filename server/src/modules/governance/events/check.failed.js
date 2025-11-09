const { governanceEventBus } = require('./event-bus');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('check-failed-event');

const publishCheckFailed = (payload) => {
  if (!payload || !payload.checkId) {
    return;
  }

  governanceEventBus.emit('check.failed.v1', payload);
  logger.warn('Check failure emitted', {
    checkId: payload.checkId,
    resultId: payload.resultId ?? null,
    severity: payload.severity ?? null,
  });
};

module.exports = {
  publishCheckFailed,
};
