const { probeEventBus } = require('@/modules/probes/events/event-bus');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('probe-failure-event');

const publishProbeFailure = (payload) => {
  probeEventBus.emit('probe.failure.v1', payload);
  logger.warn('Probe failure event emitted', {
    probeId: payload.probeId,
    errorCode: payload.errorCode,
  });
};

module.exports = {
  publishProbeFailure,
};
