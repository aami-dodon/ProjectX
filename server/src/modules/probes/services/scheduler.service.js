const { z } = require('zod');

const { createNotFoundError, createValidationError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const {
  createScheduleRecord,
  findProbeByIdentifier,
  listSchedulesByProbe,
  recordProbeEvent,
  upsertProbeMetrics,
} = require('@/modules/probes/repositories/probe.repository');
const { ProbeScheduler } = require('@/modules/probes/sdk/ProbeScheduler');
const { publishProbeEvidence } = require('@/modules/probes/events/probe.evidence');

const logger = createLogger('probe-scheduler-service');

const schedulePayloadSchema = z.object({
  type: z.enum(['cron', 'event', 'adhoc']).default('cron'),
  expression: z.string().trim().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  controls: z.array(z.string().trim().min(1)).optional(),
  metadata: z.record(z.any()).optional(),
});

const runPayloadSchema = z.object({
  trigger: z.string().trim().default('manual'),
  context: z.record(z.any()).optional(),
});

const mapScheduleRecord = (record) => ({
  id: record.id,
  type: record.type?.toLowerCase(),
  expression: record.expression,
  priority: record.priority?.toLowerCase(),
  status: record.status?.toLowerCase(),
  controls: record.controls ?? [],
  lastRunAt: record.lastRunAt,
  nextRunAt: record.nextRunAt,
  metadata: record.metadata ?? {},
});

const createSchedule = async ({ probeId, payload, actor }) => {
  const probe = await findProbeByIdentifier(probeId);
  if (!probe) {
    throw createNotFoundError('Probe could not be found', { probeId });
  }

  const parsed = schedulePayloadSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    throw createValidationError('Schedule payload is invalid', {
      issues: parsed.error.issues,
    });
  }

  const scheduler = new ProbeScheduler({
    heartbeatIntervalSeconds: probe.heartbeatIntervalSeconds,
  });
  const nextWindow = scheduler.deriveNextWindow({
    type: parsed.data.type,
    expression: parsed.data.expression,
  });

  const scheduleRecord = await createScheduleRecord(probe.id, {
    type: parsed.data.type.toUpperCase(),
    expression: parsed.data.expression ?? scheduler.defaultCron,
    priority: parsed.data.priority.toUpperCase(),
    status: 'ACTIVE',
    controls: parsed.data.controls ?? [],
    metadata: {
      ...parsed.data.metadata,
      createdBy: actor?.id ?? null,
    },
    nextRunAt: nextWindow.nextRunAt,
    lastRunAt: null,
  });

  logger.info('Probe schedule created', {
    probeId: probe.id,
    scheduleId: scheduleRecord.id,
  });

  return mapScheduleRecord(scheduleRecord);
};

const listProbeSchedules = async (probeId) => {
  const probe = await findProbeByIdentifier(probeId);
  if (!probe) {
    throw createNotFoundError('Probe could not be found', { probeId });
  }

  const records = await listSchedulesByProbe(probe.id);
  return records.map(mapScheduleRecord);
};

const triggerProbeRun = async ({ probeId, payload, actor }) => {
  const probe = await findProbeByIdentifier(probeId);
  if (!probe) {
    throw createNotFoundError('Probe could not be found', { probeId });
  }

  const parsed = runPayloadSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    throw createValidationError('Run payload is invalid', {
      issues: parsed.error.issues,
    });
  }

  const scheduler = new ProbeScheduler({
    heartbeatIntervalSeconds: probe.heartbeatIntervalSeconds,
  });
  const runWindow = scheduler.deriveNextWindow({ type: 'adhoc' });
  const runId = `run_${Date.now().toString(36)}`;

  await recordProbeEvent(probe.id, 'RUN', {
    trigger: parsed.data.trigger,
    context: parsed.data.context ?? {},
    runId,
    requestedBy: actor ? { id: actor.id, email: actor.email } : null,
  });

  await upsertProbeMetrics(probe.id, {
    heartbeatStatus: 'OPERATIONAL',
    lastHeartbeatAt: new Date(),
  });

  publishProbeEvidence({
    probeId: probe.id,
    runId,
    controls: parsed.data.context?.controls ?? [],
    status: 'accepted',
  });

  logger.info('Ad-hoc probe run scheduled', {
    probeId: probe.id,
    runId,
    trigger: parsed.data.trigger,
  });

  return {
    probeId: probe.id,
    runId,
    status: 'accepted',
    nextRunAt: runWindow.nextRunAt,
  };
};

module.exports = {
  createSchedule,
  listProbeSchedules,
  triggerProbeRun,
};
