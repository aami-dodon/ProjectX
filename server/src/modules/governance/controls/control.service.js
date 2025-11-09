const { z } = require('zod');

const { createLogger } = require('@/utils/logger');
const {
  createValidationError,
  createNotFoundError,
} = require('@/utils/errors');
const {
  aggregateControlRecords,
  archiveControlRecord,
  countControlRecords,
  createControlRecord,
  findControlById,
  listControlRecords,
  recordControlAuditEvent,
  updateControlRecord,
} = require('./repositories/control.repository');
const {
  CONTROL_ARCHIVE_SCHEMA,
  CONTROL_BASE_SCHEMA,
  CONTROL_UPDATE_SCHEMA,
} = require('./control.schemas');
const { replaceControlMappings } = require('./mapping.service');

const logger = createLogger('governance-control-service');

const LIST_SCHEMA = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  statuses: z.array(z.string()).default([]),
  riskTiers: z.array(z.string()).default([]),
  domains: z.array(z.string()).default([]),
  owners: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  search: z.string().optional(),
  sort: z.string().optional(),
});

const normalizeMultiValue = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const parseListParams = (params = {}) =>
  LIST_SCHEMA.parse({
    limit: params.limit,
    offset: params.offset,
    statuses: normalizeMultiValue(params.status ?? params.statuses),
    riskTiers: normalizeMultiValue(params.risk ?? params.riskTiers),
    domains: normalizeMultiValue(params.domain ?? params.domains),
    owners: normalizeMultiValue(params.owner ?? params.owners),
    tags: normalizeMultiValue(params.tag ?? params.tags),
    frameworks: normalizeMultiValue(params.framework ?? params.frameworks),
    search: params.search,
    sort: params.sort,
  });

const formatAggregate = (groups = [], label = 'value') =>
  groups.reduce((acc, group) => {
    if (!group || !group[label]) {
      return acc;
    }

    const key = group[label];
    const count = group?._count?._all ?? 0;
    acc[key] = count;
    return acc;
  }, {});

const slugify = (value) => {
  if (!value) {
    return null;
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-')
    .slice(0, 80);
};

const mapFrameworkLink = (link) => ({
  id: link.id,
  frameworkId: link.frameworkId,
  frameworkControlId: link.frameworkControlId,
  framework: link.framework
    ? {
        id: link.framework.id,
        slug: link.framework.slug,
        title: link.framework.title,
        status: link.framework.status,
      }
    : null,
  requirement: link.frameworkControl
    ? {
        id: link.frameworkControl.id,
        code: link.frameworkControl.code,
        title: link.frameworkControl.title,
        status: link.frameworkControl.status,
      }
    : null,
  coverageLevel: link.coverageLevel,
  status: link.status,
  evidenceReferences: link.evidenceReferences ?? [],
  effectiveFrom: link.effectiveFrom,
  effectiveTo: link.effectiveTo,
  notes: link.notes ?? null,
  metadata: link.metadata ?? null,
});

const mapCheckLink = (link) => ({
  id: link.id,
  checkId: link.checkId,
  weight: link.weight ?? 1,
  enforcementLevel: link.enforcementLevel,
  assertionType: link.assertionType ?? null,
  frequencyCadence: link.frequencyCadence ?? null,
  check: link.check
    ? {
        id: link.check.id,
        name: link.check.name,
        status: link.check.status,
        severity: link.check.severityDefault,
      }
    : null,
});

const mapScore = (score) => ({
  id: score.id,
  granularity: score.granularity,
  windowStart: score.windowStart,
  windowEnd: score.windowEnd,
  score: score.score,
  classification: score.classification,
  sampleSize: score.sampleSize ?? 0,
});

const mapAuditEvent = (event) => ({
  id: event.id,
  action: event.action,
  actorId: event.actorId ?? null,
  changeSummary: event.changeSummary ?? null,
  payloadBefore: event.payloadBefore ?? null,
  payloadAfter: event.payloadAfter ?? null,
  comment: event.comment ?? null,
  createdAt: event.createdAt,
});

const serializeControl = (record, { detail = false } = {}) => {
  if (!record) {
    return null;
  }

  const frameworkMappings = (record.frameworkLinks ?? []).map(mapFrameworkLink);
  const checkLinks = (record.checkLinks ?? []).map(mapCheckLink);
  const latestScore = record.scores?.[0] ? mapScore(record.scores[0]) : null;
  const remediationEvents = (record.auditEvents ?? []).filter(
    (event) => event.action === 'CONTROL_REMEDIATION_TRIGGERED',
  );

  const response = {
    id: record.id,
    slug: record.slug,
    title: record.title,
    description: record.description ?? null,
    rationale: record.rationale ?? null,
    implementationGuidance: record.implementationGuidance ?? null,
    ownerTeam: record.ownerTeam ?? null,
    status: record.status,
    riskTier: record.riskTier,
    enforcementLevel: record.enforcementLevel,
    version: record.version,
    taxonomy: {
      domain: record.domain ?? null,
      category: record.category ?? null,
      subCategory: record.subCategory ?? null,
    },
    tags: record.tags ?? [],
    metadata: record.metadata ?? {},
    impactWeight: record.impactWeight ?? null,
    remediationNotes: record.remediationNotes ?? null,
    stats: {
      frameworks: frameworkMappings.length,
      checks: checkLinks.length,
      coveragePercent: frameworkMappings.length
        ? Math.min(100, Math.round((checkLinks.length / frameworkMappings.length) * 100))
        : 0,
      latestScore,
    },
    frameworkMappings,
    checkLinks,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    publishedAt: record.publishedAt,
    deprecatedAt: record.deprecatedAt,
  };

  if (detail) {
    response.scoreHistory = (record.scores ?? []).map(mapScore);
    response.auditTrail = (record.auditEvents ?? []).map(mapAuditEvent);
    response.remediation = {
      notes: record.remediationNotes ?? null,
      history: remediationEvents.map((event) => ({
        id: event.metadata?.remediationTaskId ?? event.id,
        actorId: event.actorId ?? null,
        taskId: event.metadata?.remediationTaskId ?? null,
        notificationId: event.metadata?.notificationId ?? null,
        reason: event.metadata?.reason ?? event.comment ?? null,
        priority: event.metadata?.priority ?? null,
        createdAt: event.createdAt,
      })),
    };
  } else {
    response.remediation = {
      notes: record.remediationNotes ?? null,
    };
  }

  return response;
};

const ensureLifecycleTransition = (currentStatus, nextStatus) => {
  if (!nextStatus || nextStatus === currentStatus) {
    return;
  }

  const transitions = {
    DRAFT: ['ACTIVE', 'DEPRECATED'],
    ACTIVE: ['DEPRECATED'],
    DEPRECATED: [],
  };

  const allowed = transitions[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw createValidationError('Invalid lifecycle transition requested', {
      from: currentStatus,
      to: nextStatus,
    });
  }
};

const listControlCatalog = async (params = {}) => {
  const parsed = parseListParams(params);

  const [records, total, aggregates] = await Promise.all([
    listControlRecords({
      limit: parsed.limit,
      offset: parsed.offset,
      filters: {
        statuses: parsed.statuses,
        riskTiers: parsed.riskTiers,
        domains: parsed.domains,
        owners: parsed.owners,
        tags: parsed.tags,
        frameworkIds: parsed.frameworks,
        search: parsed.search,
      },
      sort: parsed.sort,
    }),
    countControlRecords({
      statuses: parsed.statuses,
      riskTiers: parsed.riskTiers,
      domains: parsed.domains,
      owners: parsed.owners,
      tags: parsed.tags,
      frameworkIds: parsed.frameworks,
      search: parsed.search,
    }),
    aggregateControlRecords(),
  ]);

  return {
    data: records.map((record) => serializeControl(record)),
    pagination: {
      total,
      limit: parsed.limit,
      offset: parsed.offset,
    },
    summary: {
      status: formatAggregate(aggregates.status, 'status'),
      riskTier: formatAggregate(aggregates.riskTier, 'riskTier'),
      domain: formatAggregate(aggregates.domain, 'domain'),
    },
  };
};

const buildControlData = ({
  payload,
  actorId,
  existing,
  bumpVersion = false,
}) => {
  const data = {};

  if (payload.slug) {
    data.slug = slugify(payload.slug) ?? payload.slug;
  }
  if (payload.title) {
    data.title = payload.title;
  }
  if (payload.description !== undefined) {
    data.description = payload.description ?? null;
  }
  if (payload.rationale !== undefined) {
    data.rationale = payload.rationale ?? null;
  }
  if (payload.implementationGuidance !== undefined) {
    data.implementationGuidance = payload.implementationGuidance ?? null;
  }
  if (payload.ownerTeam !== undefined) {
    data.ownerTeam = payload.ownerTeam ?? null;
  }
  if (payload.domain !== undefined) {
    data.domain = payload.domain ?? null;
  }
  if (payload.category !== undefined) {
    data.category = payload.category ?? null;
  }
  if (payload.subCategory !== undefined) {
    data.subCategory = payload.subCategory ?? null;
  }
  if (payload.tags !== undefined) {
    data.tags = payload.tags ?? [];
  }
  if (payload.metadata !== undefined) {
    data.metadata = payload.metadata ?? {};
  }
  if (payload.impactWeight !== undefined) {
    data.impactWeight = payload.impactWeight ?? null;
  }
  if (payload.remediationNotes !== undefined) {
    data.remediationNotes = payload.remediationNotes ?? null;
  }
  if (payload.riskTier) {
    data.riskTier = payload.riskTier;
  }
  if (payload.enforcementLevel) {
    data.enforcementLevel = payload.enforcementLevel;
  }
  if (payload.status) {
    data.status = payload.status;
    if (payload.status === 'ACTIVE' && (!existing || !existing.publishedAt)) {
      data.publishedAt = new Date();
    }
    if (payload.status === 'DEPRECATED') {
      data.deprecatedAt = new Date();
    }
  }

  if (payload.deprecatedReason !== undefined) {
    data.deprecatedReason = payload.deprecatedReason ?? null;
  }

  if (bumpVersion) {
    data.version = (existing?.version ?? 1) + 1;
  }

  data.updatedBy = actorId ?? null;
  if (!existing) {
    data.createdBy = actorId ?? null;
  }

  return data;
};

const ensureActiveMappings = (status, mappings = []) => {
  if (status !== 'ACTIVE') {
    return;
  }

  if (!Array.isArray(mappings) || mappings.length === 0) {
    throw createValidationError('Active controls require at least one mapping');
  }
};

const createControlDefinition = async ({ payload, actorId }) => {
  const parsed = CONTROL_BASE_SCHEMA.parse(payload ?? {});
  ensureActiveMappings(parsed.status, parsed.frameworkMappings ?? []);

  const controlData = {
    slug: slugify(parsed.slug) ?? parsed.slug,
    title: parsed.title,
    description: parsed.description ?? null,
    rationale: parsed.rationale ?? null,
    implementationGuidance: parsed.implementationGuidance ?? null,
    ownerTeam: parsed.ownerTeam ?? null,
    status: parsed.status,
    riskTier: parsed.riskTier,
    enforcementLevel: parsed.enforcementLevel,
    domain: parsed.domain ?? null,
    category: parsed.category ?? null,
    subCategory: parsed.subCategory ?? null,
    tags: parsed.tags ?? [],
    metadata: parsed.metadata ?? {},
    impactWeight: parsed.impactWeight ?? null,
    remediationNotes: parsed.remediationNotes ?? null,
    version: 1,
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null,
    publishedAt: parsed.status === 'ACTIVE' ? new Date() : null,
  };

  try {
    const record = await createControlRecord({
      controlData,
      frameworkLinks: parsed.frameworkMappings ?? [],
      auditEvent: {
        action: 'CONTROL_CREATED',
        actorId: actorId ?? null,
        changeSummary: 'Control definition created',
        payloadAfter: controlData,
      },
    });

    logger.info('Control definition created', {
      controlId: record.id,
      actorId,
    });

    return serializeControl(record, { detail: true });
  } catch (error) {
    if (error?.code === 'P2002') {
      throw createValidationError('Control slug already exists');
    }
    throw error;
  }
};

const updateControlDefinition = async ({ controlId, payload, actorId }) => {
  const existing = await findControlById(controlId, { detail: true });
  if (!existing) {
    throw createNotFoundError('Control not found', { controlId });
  }

  const parsed = CONTROL_UPDATE_SCHEMA.parse(payload ?? {});

  if (parsed.status) {
    ensureLifecycleTransition(existing.status, parsed.status);
    ensureActiveMappings(
      parsed.status,
      parsed.frameworkMappings ?? existing.frameworkLinks ?? [],
    );
  }

  if (existing.status === 'DEPRECATED' && parsed.status && parsed.status !== 'DEPRECATED') {
    throw createValidationError('Deprecated controls cannot return to active states');
  }

  const requiresVersionBump =
    Boolean(parsed.bumpVersion) ||
    (parsed.riskTier && parsed.riskTier !== existing.riskTier) ||
    (parsed.enforcementLevel && parsed.enforcementLevel !== existing.enforcementLevel);

  const controlData = buildControlData({
    payload: parsed,
    actorId,
    existing,
    bumpVersion: requiresVersionBump,
  });

  let record;
  try {
    record = await updateControlRecord(controlId, {
      controlData,
      auditEvent: {
        action: 'CONTROL_UPDATED',
        actorId: actorId ?? null,
        changeSummary: 'Control definition updated',
        payloadBefore: {
          status: existing.status,
          riskTier: existing.riskTier,
          enforcementLevel: existing.enforcementLevel,
        },
        payloadAfter: {
          status: controlData.status ?? existing.status,
          riskTier: controlData.riskTier ?? existing.riskTier,
          enforcementLevel: controlData.enforcementLevel ?? existing.enforcementLevel,
        },
      },
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      throw createValidationError('Control slug already exists');
    }
    throw error;
  }

  if (Array.isArray(parsed.frameworkMappings)) {
    record = await replaceControlMappings({
      controlId,
      mappings: parsed.frameworkMappings,
      actorId,
    });
  }

  logger.info('Control definition updated', { controlId, actorId });
  return serializeControl(record, { detail: true });
};

const getControlDetail = async (controlId) => {
  const record = await findControlById(controlId, { detail: true });
  if (!record) {
    throw createNotFoundError('Control not found', { controlId });
  }

  return serializeControl(record, { detail: true });
};

const archiveControlDefinition = async ({ controlId, payload, actorId }) => {
  const existing = await findControlById(controlId, { detail: true });
  if (!existing) {
    throw createNotFoundError('Control not found', { controlId });
  }

  if (existing.status === 'DEPRECATED') {
    return serializeControl(existing, { detail: true });
  }

  const parsed = CONTROL_ARCHIVE_SCHEMA.parse(payload ?? {});

  const record = await archiveControlRecord(controlId, {
    status: 'DEPRECATED',
    deprecatedAt: new Date(),
    deprecatedReason: parsed.reason,
    updatedBy: actorId ?? null,
  });

  await recordControlAuditEvent({
    controlId,
    action: 'CONTROL_ARCHIVED',
    actorId: actorId ?? null,
    changeSummary: 'Control archived with rationale',
    payloadBefore: { status: existing.status },
    payloadAfter: { status: 'DEPRECATED' },
    comment: parsed.reason,
  });

  logger.info('Control archived', { controlId, actorId });
  return serializeControl(record, { detail: true });
};

module.exports = {
  archiveControlDefinition,
  createControlDefinition,
  getControlDetail,
  listControlCatalog,
  serializeControl,
  updateControlDefinition,
};
