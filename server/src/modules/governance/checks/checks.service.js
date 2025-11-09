const { z } = require('zod');

const { createLogger } = require('@/utils/logger');
const {
  createValidationError,
  createNotFoundError,
} = require('@/utils/errors');
const {
  listChecks,
  countChecks,
  createCheckRecord,
  updateCheckRecord,
  findCheckById,
  recordVersionSnapshot,
  getControlCoverageMetrics,
  getCheckAggregates,
} = require('../repositories/checks.repository');
const { summarizeControlCoverage } = require('../mappers/control-mapping.service');

const logger = createLogger('governance-checks-service');

const LIST_SCHEMA = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  statuses: z.array(z.string()).default([]),
  types: z.array(z.string()).default([]),
  controlIds: z.array(z.string()).default([]),
  probeIds: z.array(z.string()).default([]),
  severities: z.array(z.string()).default([]),
  search: z.string().optional(),
  sort: z.string().optional(),
});

const CONTROL_LINK_SCHEMA = z.object({
  controlId: z.string().min(1, 'controlId is required'),
  weight: z.number().positive().max(100).optional(),
  enforcementLevel: z.enum(['OPTIONAL', 'RECOMMENDED', 'MANDATORY']).optional(),
  evidenceRequirements: z.string().max(2000).optional(),
  metadata: z.record(z.any()).optional(),
});

const CHECK_BASE_SCHEMA = z.object({
  name: z.string().min(3).max(255),
  description: z.string().max(4000).optional(),
  type: z.enum(['AUTOMATED', 'MANUAL', 'HYBRID']).default('AUTOMATED'),
  severityDefault: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  frequency: z.string().max(120).optional(),
  probeId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string().min(1)).max(20).optional(),
  controlMappings: z.array(CONTROL_LINK_SCHEMA).optional(),
});

const UPDATE_SCHEMA = CHECK_BASE_SCHEMA.partial().extend({
  status: z.enum(['DRAFT', 'READY_FOR_VALIDATION', 'ACTIVE', 'RETIRED']).optional(),
  bumpVersion: z.boolean().optional(),
});

const normalizeMultiValue = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const serializeCheck = (record) => ({
  id: record.id,
  name: record.name,
  description: record.description ?? null,
  type: record.type,
  status: record.status,
  severityDefault: record.severityDefault,
  frequency: record.frequency ?? null,
  probeId: record.probeId ?? null,
  version: record.version,
  tags: record.tags ?? [],
  metadata: record.metadata ?? {},
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  lastRunAt: record.lastRunAt,
  nextRunAt: record.nextRunAt,
  lifecycle: {
    readyAt: record.readyAt,
    retiredAt: record.retiredAt,
  },
  latestResult: record.results?.[0]
    ? {
        id: record.results[0].id,
        status: record.results[0].status,
        severity: record.results[0].severity,
        executedAt: record.results[0].executedAt,
        publicationState: record.results[0].publicationState,
      }
    : null,
  controlMappings: (record.controlLinks ?? []).map((link) => ({
    id: link.id,
    controlId: link.controlId,
    weight: link.weight ?? 1,
    enforcementLevel: link.enforcementLevel,
    evidenceRequirements: link.evidenceRequirements ?? null,
    metadata: link.metadata ?? null,
  })),
  openReviews: (record.reviewQueue ?? []).map((item) => ({
    id: item.id,
    priority: item.priority,
    state: item.state,
    dueAt: item.dueAt,
    assignedTo: item.assignedTo,
  })),
});

const parseListParams = (params = {}) =>
  LIST_SCHEMA.parse({
    limit: params.limit,
    offset: params.offset,
    statuses: normalizeMultiValue(params.status ?? params.statuses),
    types: normalizeMultiValue(params.type ?? params.types),
    controlIds: normalizeMultiValue(params.controlId ?? params.controlIds),
    probeIds: normalizeMultiValue(params.probeId ?? params.probeIds),
    severities: normalizeMultiValue(params.severity ?? params.severities),
    search: params.search,
    sort: params.sort,
  });

const ensureLifecycleTransition = (currentStatus, nextStatus) => {
  if (!nextStatus || nextStatus === currentStatus) {
    return;
  }

  const transitions = {
    DRAFT: ['READY_FOR_VALIDATION'],
    READY_FOR_VALIDATION: ['ACTIVE'],
    ACTIVE: ['RETIRED'],
    RETIRED: [],
  };

  const allowed = transitions[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw createValidationError('Invalid lifecycle transition requested', {
      from: currentStatus,
      to: nextStatus,
    });
  }
};

const listCheckDefinitions = async (params = {}) => {
  const parsed = parseListParams(params);

  const [records, total, aggregates, coverage] = await Promise.all([
    listChecks(parsed),
    countChecks(parsed),
    getCheckAggregates(),
    getControlCoverageMetrics().then((data) => summarizeControlCoverage(data)),
  ]);

  const serializeAggregate = (groups = [], field = 'value') =>
    groups.reduce((acc, group) => {
      if (!group || !group[field]) {
        return acc;
      }

      const label = group[field];
      const count = group?._count?._all ?? 0;
      acc[label] = count;
      return acc;
    }, {});

  return {
    data: records.map(serializeCheck),
    pagination: {
      total,
      limit: parsed.limit,
      offset: parsed.offset,
    },
    summary: {
      status: serializeAggregate(aggregates.status, 'status'),
      type: serializeAggregate(aggregates.type, 'type'),
      severity: serializeAggregate(aggregates.severity, 'severityDefault'),
      coverage,
    },
  };
};

const createCheckDefinition = async ({ payload, actorId }) => {
  const parsed = CHECK_BASE_SCHEMA.parse(payload ?? {});

  const record = await createCheckRecord({
    name: parsed.name,
    description: parsed.description ?? null,
    type: parsed.type,
    severityDefault: parsed.severityDefault,
    frequency: parsed.frequency ?? null,
    probeId: parsed.probeId ?? null,
    metadata: parsed.metadata ?? {},
    tags: parsed.tags ?? [],
    controlLinks: parsed.controlMappings ?? [],
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null,
    status: 'DRAFT',
    version: 1,
  });

  await recordVersionSnapshot({
    checkId: record.id,
    version: record.version,
    statusSnapshot: record.status,
    definition: parsed,
    createdBy: actorId ?? null,
  });

  logger.info('Check definition created', { checkId: record.id, actorId });
  return serializeCheck(record);
};

const updateCheckDefinition = async ({ checkId, payload, actorId }) => {
  const existing = await findCheckById(checkId);
  if (!existing) {
    throw createNotFoundError('Check definition not found', { checkId });
  }

  const parsed = UPDATE_SCHEMA.parse(payload ?? {});

  if (existing.status === 'RETIRED' && parsed.status && parsed.status !== 'RETIRED') {
    throw createValidationError('Retired checks cannot transition back to active states');
  }

  if (parsed.status) {
    ensureLifecycleTransition(existing.status, parsed.status);
  }

  const shouldBumpVersion =
    Boolean(parsed.bumpVersion) || (parsed.status && parsed.status !== existing.status);

  const updates = {
    ...parsed,
    updatedBy: actorId ?? existing.updatedBy ?? null,
    controlLinks: parsed.controlMappings,
  };

  if (shouldBumpVersion) {
    updates.version = existing.version + 1;
  } else {
    delete updates.bumpVersion;
  }

  delete updates.controlMappings;
  delete updates.bumpVersion;

  const updated = await updateCheckRecord(checkId, updates);

  if (shouldBumpVersion) {
    await recordVersionSnapshot({
      checkId: updated.id,
      version: updated.version,
      statusSnapshot: updated.status,
      definition: parsed,
      createdBy: actorId ?? null,
      diff: {
        previousVersion: existing.version,
        updatedVersion: updated.version,
      },
    });
  }

  return serializeCheck(updated);
};

module.exports = {
  createCheckDefinition,
  listCheckDefinitions,
  serializeCheck,
  updateCheckDefinition,
};
