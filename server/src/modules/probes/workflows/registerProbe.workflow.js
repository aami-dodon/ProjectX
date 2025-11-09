const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');
const { publishProbeHeartbeat } = require('@/modules/probes/events/probe.heartbeat');
const { createProbeRecord, recordProbeEvent, upsertProbeMetrics } = require('@/modules/probes/repositories/probe.repository');
const { ProbeConfigLoader } = require('@/modules/probes/sdk/ProbeConfigLoader');
const { ProbeVersionManager } = require('@/modules/probes/sdk/ProbeVersionManager');

const logger = createLogger('register-probe-workflow');

const registerProbeWorkflow = async ({ payload, actor }) => {
  const configLoader = new ProbeConfigLoader({
    defaults: {
      heartbeatIntervalSeconds: env.PROBE_HEARTBEAT_INTERVAL_SECONDS,
      deploymentTopic: env.PROBE_DEPLOYMENT_TOPIC,
    },
  });

  const effectiveOverlay = configLoader.merge(payload.environmentOverlays);

  const versionManager = new ProbeVersionManager({
    minimumVersion: env.PROBE_SDK_VERSION_MIN,
    targetVersion: env.PROBE_SDK_VERSION_TARGET,
  });
  versionManager.assertCompatible(payload.sdkVersionMin ?? env.PROBE_SDK_VERSION_MIN);

  const record = await createProbeRecord({
    slug: payload.slug,
    name: payload.name,
    description: payload.description,
    ownerEmail: payload.ownerEmail,
    ownerTeam: payload.ownerTeam,
    status: payload.status,
    frameworkBindings: payload.frameworkBindings,
    evidenceSchema: payload.evidenceSchema,
    tags: payload.tags,
    environmentOverlays: effectiveOverlay,
    sdkVersionMin: payload.sdkVersionMin ?? env.PROBE_SDK_VERSION_MIN,
    sdkVersionTarget: payload.sdkVersionTarget ?? env.PROBE_SDK_VERSION_TARGET,
    heartbeatIntervalSeconds:
      payload.heartbeatIntervalSeconds ?? env.PROBE_HEARTBEAT_INTERVAL_SECONDS,
    alertChannels: payload.alertChannels,
    metadata: payload.metadata ?? {},
  });

  await upsertProbeMetrics(record.id, {
    heartbeatStatus: 'OPERATIONAL',
    heartbeatIntervalSeconds:
      payload.heartbeatIntervalSeconds ?? env.PROBE_HEARTBEAT_INTERVAL_SECONDS,
    failureCount24h: 0,
    metadata: {
      createdBy: actor?.id ?? null,
    },
  });

  await recordProbeEvent(record.id, 'HEARTBEAT', {
    status: 'operational',
    trigger: 'registration',
    actor: actor ? { id: actor.id, email: actor.email } : null,
  });

  publishProbeHeartbeat({
    probeId: record.id,
    slug: record.slug,
    status: 'operational',
    actor,
  });

  logger.info('Probe registered', { probeId: record.id, actorId: actor?.id ?? null });

  return record;
};

module.exports = {
  registerProbeWorkflow,
};
