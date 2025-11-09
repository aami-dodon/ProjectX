const crypto = require('node:crypto');
const { z } = require('zod');

const { env } = require('@/config/env');
const { createNotFoundError, createValidationError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const {
  countProbes,
  findProbeByIdentifier,
  listProbes,
} = require('@/modules/probes/repositories/probe.repository');
const { registerProbeWorkflow } = require('@/modules/probes/workflows/registerProbe.workflow');
const {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  PROBE_STATUSES,
} = require('@/modules/probes/constants');

const logger = createLogger('probe-registry-service');
const statusSet = new Set(PROBE_STATUSES);

const paginationSchema = z.object({
  limit: z
    .union([z.number(), z.string()])
    .transform((value) => Number(value))
    .pipe(z.number().int().positive().max(MAX_PAGE_LIMIT))
    .default(DEFAULT_PAGE_LIMIT),
  offset: z
    .union([z.number(), z.string()])
    .transform((value) => Number(value))
    .pipe(z.number().int().min(0))
    .default(0),
});

const probePayloadSchema = z.object({
  name: z.string().trim().min(3),
  description: z.string().trim().optional(),
  ownerEmail: z.string().trim().email(),
  ownerTeam: z.string().trim().optional(),
  status: z.string().trim().optional(),
  frameworkBindings: z.array(z.string().trim().min(1)).min(1),
  evidenceSchema: z.record(z.any()).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  environmentOverlays: z.record(z.any()).optional(),
  sdkVersionMin: z.string().trim().optional(),
  sdkVersionTarget: z.string().trim().optional(),
  heartbeatIntervalSeconds: z.number().int().positive().optional(),
  alertChannels: z.array(z.string().trim().min(3)).optional(),
  metadata: z.record(z.any()).optional(),
});

const normalizeStatusFilter = (status) => {
  if (!status || typeof status !== 'string') {
    return undefined;
  }

  const normalized = status.trim().toLowerCase();
  if (!statusSet.has(normalized)) {
    return undefined;
  }

  return normalized.toUpperCase();
};

const normalizeFrameworkFilter = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : null))
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const generateProbeSlug = (name) => {
  const base = slugify(name || 'probe');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
};

const mapProbeRecord = (record) => {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    ownerEmail: record.ownerEmail,
    ownerTeam: record.ownerTeam,
    status: record.status?.toLowerCase(),
    frameworkBindings: record.frameworkBindings ?? [],
    evidenceSchema: record.evidenceSchema ?? null,
    tags: record.tags ?? [],
    environmentOverlays: record.environmentOverlays ?? null,
    sdkVersionMin: record.sdkVersionMin ?? env.PROBE_SDK_VERSION_MIN,
    sdkVersionTarget: record.sdkVersionTarget ?? env.PROBE_SDK_VERSION_TARGET,
    heartbeatIntervalSeconds:
      record.heartbeatIntervalSeconds ?? env.PROBE_HEARTBEAT_INTERVAL_SECONDS,
    alertChannels: record.alertChannels ?? [],
    lastDeployedAt: record.lastDeployedAt ?? null,
    metadata: record.metadata ?? {},
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    metrics: record.metrics
      ? {
          status: record.metrics.heartbeatStatus?.toLowerCase(),
          lastHeartbeatAt: record.metrics.lastHeartbeatAt,
          failureCount24h: record.metrics.failureCount24h,
          latencyP95Ms: record.metrics.latencyP95Ms,
          latencyP99Ms: record.metrics.latencyP99Ms,
          errorRatePercent: record.metrics.errorRatePercent,
          evidenceThroughputPerHour: record.metrics.evidenceThroughputPerHour,
          lastErrorCode: record.metrics.lastErrorCode,
        }
      : null,
    schedules: (record.schedules ?? []).map((schedule) => ({
      id: schedule.id,
      type: schedule.type?.toLowerCase(),
      expression: schedule.expression,
      priority: schedule.priority?.toLowerCase(),
      status: schedule.status?.toLowerCase(),
      controls: schedule.controls ?? [],
      lastRunAt: schedule.lastRunAt,
      nextRunAt: schedule.nextRunAt,
    })),
    deployments: (record.deployments ?? []).map((deployment) => ({
      id: deployment.id,
      version: deployment.version,
      environment: deployment.environment,
      status: deployment.status?.toLowerCase(),
      summary: deployment.summary,
      canaryPercent: deployment.canaryPercent,
      startedAt: deployment.startedAt,
      completedAt: deployment.completedAt,
    })),
  };
};

const listRegistryProbes = async (query = {}) => {
  const { limit, offset } = paginationSchema.parse({
    limit: query.limit,
    offset: query.offset,
  });

  const status = normalizeStatusFilter(query.status);
  const frameworkIds = normalizeFrameworkFilter(query.frameworkId ?? query.frameworkIds);
  const owner = typeof query.owner === 'string' && query.owner.trim() ? query.owner.trim() : undefined;
  const search =
    typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined;

  const [records, total] = await Promise.all([
    listProbes({ limit, offset, status, frameworkIds, owner, search }),
    countProbes({ status, frameworkIds, owner, search }),
  ]);

  return {
    data: records.map(mapProbeRecord),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    },
  };
};

const createProbe = async (payload, actor) => {
  const parsed = probePayloadSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    throw createValidationError('Probe registration payload is invalid', {
      issues: parsed.error.issues,
    });
  }

  const body = parsed.data;
  const status = normalizeStatusFilter(body.status ?? 'draft') ?? 'DRAFT';
  const slug = generateProbeSlug(body.name);

  try {
    const record = await registerProbeWorkflow({
      payload: {
        ...body,
        slug,
        status,
        tags: body.tags ?? [],
        alertChannels: body.alertChannels ?? [],
      },
      actor,
    });

    const hydrated = await findProbeByIdentifier(record.id);
    return mapProbeRecord(hydrated ?? record);
  } catch (error) {
    if (error?.code === 'P2002') {
      throw createValidationError('A probe with similar details already exists');
    }

    logger.error('Probe registration failed', { error: error.message });
    throw error;
  }
};

const getProbe = async (identifier) => {
  const record = await findProbeByIdentifier(identifier);
  if (!record) {
    throw createNotFoundError('Probe could not be found', { identifier });
  }

  return mapProbeRecord(record);
};

module.exports = {
  createProbe,
  getProbe,
  listRegistryProbes,
};
