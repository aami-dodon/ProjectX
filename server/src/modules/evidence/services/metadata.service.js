const { EvidenceEventAction, EvidenceRetentionState } = require('@prisma/client');
const {
  buildWhereClause,
  countEvidenceRecords,
  ensureDefaultRetentionPolicy,
  findEvidenceById,
  findRetentionPolicyById,
  listEvidenceRecords,
  listRetentionPoliciesWithStats,
  listUpcomingRetentionTransitions,
  summarizeRetentionStates,
  updateEvidenceRecord,
} = require('../repositories/evidence.repository');
const { addEvidenceLinks, removeEvidenceLinkById } = require('../repositories/evidence-links.repository');
const { recordEvidenceEvent } = require('../events/evidence.events');
const {
  serializeEvidenceRecord,
  serializeRetentionPolicy,
} = require('../evidence.serializers');
const {
  LINK_COLLECTION_SCHEMA,
  LIST_QUERY_SCHEMA,
  METADATA_UPDATE_SCHEMA,
} = require('../evidence.schemas');
const { createLogger } = require('@/utils/logger');
const { createNotFoundError, createValidationError } = require('@/utils/errors');
const { calculateRetentionTimeline } = require('../tasks/retention.scheduler');

const logger = createLogger('evidence-metadata-service');

const listEvidenceLibrary = async ({ query }) => {
  const parsed = await LIST_QUERY_SCHEMA.parseAsync(query ?? {});
  const where = buildWhereClause(parsed);
  const [records, total, retentionSummary] = await Promise.all([
    listEvidenceRecords({ where, limit: parsed.limit, offset: parsed.offset, sort: parsed.sort }),
    countEvidenceRecords(where),
    summarizeRetentionStates(where),
  ]);

  const retention = Object.values(EvidenceRetentionState).reduce((acc, state) => {
    acc[state] = 0;
    return acc;
  }, {});
  Object.assign(retention, retentionSummary);

  return {
    data: records.map((record) => serializeEvidenceRecord(record)),
    pagination: {
      total,
      limit: parsed.limit,
      offset: parsed.offset,
    },
    summary: {
      retention,
    },
  };
};

const getEvidenceDetail = async (evidenceId) => {
  const record = await findEvidenceById(evidenceId);
  if (!record) {
    throw createNotFoundError('Evidence record not found');
  }

  return serializeEvidenceRecord(record, { includeEvents: true, includeVersions: true });
};

const resolveRetentionPolicy = async (policyId) => {
  if (policyId === null) {
    return { id: null, policy: null };
  }

  if (policyId === undefined) {
    return { id: undefined, policy: null };
  }

  const policy = await findRetentionPolicyById(policyId);
  if (!policy) {
    throw createValidationError('Retention policy not found', { field: 'retentionPolicyId' });
  }

  return { id: policyId, policy };
};

const updateEvidenceMetadata = async ({ evidenceId, payload, actorId }) => {
  const parsed = await METADATA_UPDATE_SCHEMA.parseAsync(payload ?? {});
  const existing = await findEvidenceById(evidenceId);
  if (!existing) {
    throw createNotFoundError('Evidence record not found');
  }

  const update = {};

  if (parsed.description !== undefined) {
    update.description = parsed.description;
  }

  if (parsed.tags !== undefined) {
    update.tags = parsed.tags;
  }

  if (parsed.metadata !== undefined) {
    update.metadata = parsed.metadata;
  }

  let newPolicy = null;
  if (parsed.retentionPolicyId !== undefined) {
    const { id, policy } = await resolveRetentionPolicy(parsed.retentionPolicyId);
    update.retentionPolicyId = id ?? null;
    newPolicy = policy;
  }

  if (parsed.purgeScheduledFor !== undefined) {
    update.purgeScheduledFor = parsed.purgeScheduledFor;
  }

  if (parsed.archivedAt !== undefined) {
    update.archivedAt = parsed.archivedAt;
  }

  let eventAction = EvidenceEventAction.METADATA_UPDATED;
  if (parsed.retentionState) {
    update.retentionState = parsed.retentionState;
    eventAction = EvidenceEventAction.RETENTION_UPDATED;

    const policyForTimeline = newPolicy ?? existing.retentionPolicy;
    const timeline = calculateRetentionTimeline({
      createdAt: existing.createdAt,
      retentionPolicy: policyForTimeline,
    });

    if (parsed.retentionState === EvidenceRetentionState.ACTIVE) {
      update.archivedAt = null;
      update.legalHoldAppliedAt = null;
      update.purgeScheduledFor = null;
    }

    if (parsed.retentionState === EvidenceRetentionState.ARCHIVED) {
      update.archivedAt = parsed.archivedAt ?? timeline.archiveAt ?? new Date();
      update.purgeScheduledFor = parsed.purgeScheduledFor ?? timeline.purgeAt ?? null;
    }

    if (parsed.retentionState === EvidenceRetentionState.PURGE_SCHEDULED) {
      update.purgeScheduledFor = parsed.purgeScheduledFor ?? timeline.purgeAt ?? new Date();
    }

    if (parsed.retentionState === EvidenceRetentionState.LEGAL_HOLD) {
      update.legalHoldAppliedAt = existing.legalHoldAppliedAt ?? new Date();
    }
  }

  const shouldCreateVersion = Boolean(parsed.bumpVersion);
  if (Object.keys(update).length === 0 && !shouldCreateVersion) {
    throw createValidationError('No metadata updates were provided');
  }

  const updated = await updateEvidenceRecord({
    evidenceId,
    data: update,
    createVersion: shouldCreateVersion,
    actorId,
  });

  if (!updated) {
    throw createNotFoundError('Evidence record not found');
  }

  await recordEvidenceEvent({
    evidenceId,
    action: eventAction,
    actorId,
    metadata: {
      retentionState: update.retentionState ?? existing.retentionState,
    },
  });

  logger.info('Updated evidence metadata', {
    evidenceId,
    action: eventAction,
  });

  return serializeEvidenceRecord(updated, { includeEvents: true, includeVersions: true });
};

const attachEvidenceLinks = async ({ evidenceId, payload, actorId }) => {
  const parsed = await LINK_COLLECTION_SCHEMA.parseAsync(payload ?? {});
  parsed.links.forEach((link, index) => {
    if (!link.controlId && !link.checkId && !link.taskReference) {
      throw createValidationError('Each link must include a control, check, or task reference', {
        field: `links[${index}]`,
      });
    }
  });

  const updated = await addEvidenceLinks(evidenceId, parsed.links);
  if (!updated) {
    throw createNotFoundError('Evidence record not found');
  }

  await recordEvidenceEvent({
    evidenceId,
    actorId,
    action: EvidenceEventAction.LINK_ATTACHED,
    metadata: {
      linkCount: parsed.links.length,
    },
  });

  return serializeEvidenceRecord(updated, { includeEvents: true });
};

const detachEvidenceLink = async ({ evidenceId, linkId, actorId }) => {
  const updated = await removeEvidenceLinkById(evidenceId, linkId);
  if (!updated) {
    throw createNotFoundError('Evidence link not found');
  }

  await recordEvidenceEvent({
    evidenceId,
    actorId,
    action: EvidenceEventAction.LINK_REMOVED,
    metadata: {
      linkId,
    },
  });

  return serializeEvidenceRecord(updated, { includeEvents: true });
};

const getRetentionSummary = async () => {
  await ensureDefaultRetentionPolicy();

  const [policies, statsRaw, upcoming] = await Promise.all([
    listRetentionPoliciesWithStats(),
    summarizeRetentionStates(),
    listUpcomingRetentionTransitions({ limit: 25 }),
  ]);

  const stats = Object.values(EvidenceRetentionState).reduce((acc, state) => {
    acc[state] = statsRaw[state] ?? 0;
    return acc;
  }, {});

  return {
    stats,
    policies: policies.map((policy) => ({
      ...serializeRetentionPolicy(policy),
      evidenceCount: policy._count?.evidence ?? 0,
    })),
    upcoming: upcoming.map((record) => ({
      id: record.id,
      name: record.displayName,
      retentionState: record.retentionState,
      purgeScheduledFor: record.purgeScheduledFor?.toISOString() ?? null,
      retentionPolicy: serializeRetentionPolicy(record.retentionPolicy),
    })),
  };
};

module.exports = {
  attachEvidenceLinks,
  detachEvidenceLink,
  getEvidenceDetail,
  getRetentionSummary,
  listEvidenceLibrary,
  updateEvidenceMetadata,
};
