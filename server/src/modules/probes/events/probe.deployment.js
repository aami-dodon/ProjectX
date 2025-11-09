const { probeEventBus } = require('@/modules/probes/events/event-bus');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('probe-deployment-event');

const publishProbeDeployment = (payload) => {
  probeEventBus.emit('probe.deployment.v1', payload);
  logger.info('Probe deployment event emitted', {
    probeId: payload.probeId,
    version: payload.version,
    status: payload.status,
  });
};

module.exports = {
  publishProbeDeployment,
};
