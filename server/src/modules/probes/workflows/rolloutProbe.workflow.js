const { createLogger } = require('@/utils/logger');
const {
  createDeploymentRecord,
  recordProbeEvent,
  touchLastDeployment,
} = require('@/modules/probes/repositories/probe.repository');
const { ProbeHealthClient } = require('@/modules/probes/sdk/ProbeHealthClient');
const { publishProbeDeployment } = require('@/modules/probes/events/probe.deployment');
const { publishProbeFailure } = require('@/modules/probes/events/probe.failure');

const logger = createLogger('rollout-probe-workflow');

const rolloutProbeWorkflow = async ({ probe, payload, actor }) => {
  const healthClient = new ProbeHealthClient({
    heartbeatIntervalSeconds: probe.heartbeatIntervalSeconds,
  });

  const selfTest = await healthClient.runSelfTest({ probe, manifest: payload });
  const startedAt = new Date();
  const status = selfTest.passed ? 'COMPLETED' : 'FAILED';

  const deploymentRecord = await createDeploymentRecord(probe.id, {
    version: payload.version,
    environment: payload.environment,
    canaryPercent: payload.canaryPercent ?? null,
    status,
    summary: payload.summary ?? `Deploying ${payload.version} to ${payload.environment}`,
    manifest: {
      overlayId: payload.overlayId ?? null,
      environment: payload.environment,
    },
    metadata: payload.metadata ?? {},
    selfTestSnapshot: selfTest,
    startedAt,
    completedAt: selfTest.passed ? new Date() : null,
    rolledBackAt: selfTest.passed ? null : startedAt,
  });

  await recordProbeEvent(probe.id, 'DEPLOYMENT', {
    deploymentId: deploymentRecord.id,
    status: status.toLowerCase(),
    version: payload.version,
    actor: actor ? { id: actor.id, email: actor.email } : null,
  });

  if (selfTest.passed) {
    publishProbeDeployment({
      probeId: probe.id,
      deploymentId: deploymentRecord.id,
      version: payload.version,
      status: 'completed',
    });
    await touchLastDeployment(probe.id, deploymentRecord.completedAt ?? startedAt);
  } else {
    publishProbeFailure({
      probeId: probe.id,
      errorCode: 'self-test-failed',
      deploymentId: deploymentRecord.id,
    });
  }

  logger.info('Probe rollout processed', {
    probeId: probe.id,
    deploymentId: deploymentRecord.id,
    status,
  });

  return deploymentRecord;
};

module.exports = {
  rolloutProbeWorkflow,
};
