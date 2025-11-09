const { probeEventBus } = require('@/modules/probes/events/event-bus');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('probe-evidence-event');

const publishProbeEvidence = (payload) => {
  probeEventBus.emit('probe.evidence.v1', payload);
  logger.info('Probe evidence event emitted', {
    probeId: payload.probeId,
    controls: payload.controlMappings ?? [],
  });
};

module.exports = {
  publishProbeEvidence,
};
