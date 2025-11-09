const { createValidationError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const { publishProbeEvidence } = require('@/modules/probes/events/probe.evidence');
const { publishProbeHeartbeat } = require('@/modules/probes/events/probe.heartbeat');

const logger = createLogger('probe-sdk-client');

class ProbeClient {
  constructor({ probeId, credential } = {}) {
    if (!probeId) {
      throw createValidationError('ProbeClient requires a probe identifier');
    }

    this.probeId = probeId;
    this.credential = credential ?? null;
  }

  submitEvidence({ payload, controlMappings = [], checksum } = {}) {
    if (!payload) {
      throw createValidationError('Evidence payload is required');
    }

    const record = {
      probeId: this.probeId,
      payload,
      controlMappings,
      checksum: checksum ?? null,
    };

    publishProbeEvidence(record);
    logger.info('Evidence payload submitted', {
      probeId: this.probeId,
      controls: controlMappings,
    });

    return {
      status: 'accepted',
      submittedAt: new Date().toISOString(),
    };
  }

  submitHeartbeat(status = 'operational', metadata = {}) {
    publishProbeHeartbeat({
      probeId: this.probeId,
      status,
      metadata,
    });

    logger.debug('Heartbeat submitted', { probeId: this.probeId, status });

    return {
      status,
      submittedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  ProbeClient,
};
