const { createNotFoundError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const {
  findProbeByIdentifier,
  getProbeMetrics,
  recordProbeEvent,
  upsertProbeMetrics,
} = require('@/modules/probes/repositories/probe.repository');
const { publishProbeFailure } = require('@/modules/probes/events/probe.failure');
const { publishProbeHeartbeat } = require('@/modules/probes/events/probe.heartbeat');
const { ProbeHealthClient } = require('@/modules/probes/sdk/ProbeHealthClient');

const logger = createLogger('probe-health-service');

const mapMetrics = (record, probe) => ({
  probeId: probe.id,
  status: record?.heartbeatStatus?.toLowerCase() ?? 'unknown',
  heartbeatIntervalSeconds: record?.heartbeatIntervalSeconds ?? probe.heartbeatIntervalSeconds,
  lastHeartbeatAt: record?.lastHeartbeatAt ?? null,
  failureCount24h: record?.failureCount24h ?? 0,
  latencyP95Ms: record?.latencyP95Ms ?? null,
  latencyP99Ms: record?.latencyP99Ms ?? null,
  errorRatePercent: record?.errorRatePercent ?? null,
  evidenceThroughputPerHour: record?.evidenceThroughputPerHour ?? null,
  lastErrorCode: record?.lastErrorCode ?? null,
  metadata: record?.metadata ?? {},
});

const getProbeMetricsSummary = async (probeId) => {
  const probe = await findProbeByIdentifier(probeId);
  if (!probe) {
    throw createNotFoundError('Probe could not be found', { probeId });
  }

  const metrics = await getProbeMetrics(probe.id);
  return mapMetrics(metrics, probe);
};

const recordProbeHeartbeat = async ({ probeId, status = 'operational', latencyMs, errorCode }) => {
  const probe = await findProbeByIdentifier(probeId);
  if (!probe) {
    throw createNotFoundError('Probe could not be found', { probeId });
  }

  const healthClient = new ProbeHealthClient({
    heartbeatIntervalSeconds: probe.heartbeatIntervalSeconds,
  });

  const normalizedStatus = healthClient.classifyStatus(status);

  const previousFailures = probe.metrics?.failureCount24h ?? 0;

  await upsertProbeMetrics(probe.id, {
    heartbeatStatus: normalizedStatus.toUpperCase(),
    lastHeartbeatAt: new Date(),
    latencyP95Ms: latencyMs ?? null,
    lastErrorCode: errorCode ?? null,
    failureCount24h: normalizedStatus === 'outage' ? previousFailures + 1 : previousFailures,
  });

  await recordProbeEvent(probe.id, normalizedStatus === 'outage' ? 'FAILURE' : 'HEARTBEAT', {
    status: normalizedStatus,
    latencyMs: latencyMs ?? null,
    errorCode: errorCode ?? null,
  });

  if (normalizedStatus === 'outage') {
    publishProbeFailure({
      probeId: probe.id,
      slug: probe.slug,
      errorCode: errorCode ?? 'unknown',
    });
  } else {
    publishProbeHeartbeat({
      probeId: probe.id,
      slug: probe.slug,
      status: normalizedStatus,
    });
  }

  logger.info('Probe heartbeat recorded', { probeId: probe.id, status: normalizedStatus });

  return getProbeMetricsSummary(probe.id);
};

module.exports = {
  getProbeMetricsSummary,
  recordProbeHeartbeat,
};
