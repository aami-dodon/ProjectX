const { z } = require('zod');

const { createNotFoundError, createValidationError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const {
  findProbeByIdentifier,
  listDeploymentsByProbe,
} = require('@/modules/probes/repositories/probe.repository');
const { rolloutProbeWorkflow } = require('@/modules/probes/workflows/rolloutProbe.workflow');

const logger = createLogger('probe-deployment-service');

const deploymentPayloadSchema = z.object({
  version: z.string().trim().min(1),
  environment: z.string().trim().min(2),
  overlayId: z.string().trim().optional(),
  canaryPercent: z.number().int().min(0).max(100).optional(),
  summary: z.string().trim().optional(),
  metadata: z.record(z.any()).optional(),
});

const mapDeploymentRecord = (record) => ({
  id: record.id,
  version: record.version,
  environment: record.environment,
  status: record.status?.toLowerCase(),
  summary: record.summary,
  canaryPercent: record.canaryPercent,
  startedAt: record.startedAt,
  completedAt: record.completedAt,
  rolledBackAt: record.rolledBackAt,
  metadata: record.metadata ?? {},
});

const launchDeployment = async ({ probeId, payload, actor }) => {
  const probe = await findProbeByIdentifier(probeId);
  if (!probe) {
    throw createNotFoundError('Probe could not be found', { probeId });
  }

  const parsed = deploymentPayloadSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    throw createValidationError('Deployment payload is invalid', {
      issues: parsed.error.issues,
    });
  }

  const deployment = await rolloutProbeWorkflow({
    probe,
    payload: parsed.data,
    actor,
  });

  logger.info('Probe deployment launched', {
    probeId: probe.id,
    deploymentId: deployment.id,
  });

  return mapDeploymentRecord(deployment);
};

const listProbeDeployments = async (probeId) => {
  const probe = await findProbeByIdentifier(probeId);
  if (!probe) {
    throw createNotFoundError('Probe could not be found', { probeId });
  }

  const records = await listDeploymentsByProbe(probe.id, 50);
  return records.map(mapDeploymentRecord);
};

module.exports = {
  launchDeployment,
  listProbeDeployments,
};
