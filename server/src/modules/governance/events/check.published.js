const { governanceEventBus } = require('./event-bus');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('check-published-event');

const publishCheckPublished = (payload) => {
  if (!payload || !payload.checkId || !payload.resultId) {
    return;
  }

  governanceEventBus.emit('check.published.v1', payload);
  logger.info('Check published event emitted', {
    checkId: payload.checkId,
    resultId: payload.resultId,
    severity: payload.severity,
  });
};

module.exports = {
  publishCheckPublished,
};
