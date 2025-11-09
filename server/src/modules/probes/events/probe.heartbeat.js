const { probeEventBus } = require('@/modules/probes/events/event-bus');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('probe-heartbeat-event');

const publishProbeHeartbeat = (payload) => {
  probeEventBus.emit('probe.heartbeat.v1', payload);
  logger.debug('Probe heartbeat event emitted', {
    probeId: payload.probeId,
    status: payload.status,
  });
};

module.exports = {
  publishProbeHeartbeat,
};
