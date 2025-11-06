const { isDeepStrictEqual } = require('util');
const { createLogger } = require('@/utils/logger');
const {
  listPolicies: listPoliciesRepo,
  createPolicy: createPolicyRepo,
  updatePolicy: updatePolicyRepo,
  deletePolicy: deletePolicyRepo,
  findPolicyById,
  createPolicyRevision,
} = require('../repositories/policy.repository');
const { invalidateEnforcer } = require('../rbac-enforcer');
const {
  createValidationError,
  createNotFoundError,
} = require('@/utils/errors');

const logger = createLogger('policy-service');

const normalizeType = (type) => {
  if (typeof type !== 'string') {
    return null;
  }

  const normalized = type.trim().toLowerCase();
  if (['p', 'g', 'g2'].includes(normalized)) {
    return normalized;
  }

  return null;
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const buildPolicyPayload = (payload) => ({
  type: normalizeType(payload.type) ?? 'p',
  subject: normalizeString(payload.subject) || null,
  domain: normalizeString(payload.domain) || 'global',
  object: normalizeString(payload.object) || null,
  action: normalizeString(payload.action) || null,
  effect: normalizeString(payload.effect) || 'allow',
  description: normalizeString(payload.description) || null,
  metadata: payload.metadata ?? null,
});

const validatePolicyPayload = (policy) => {
  if (policy.type === 'p') {
    if (!policy.subject) {
      throw createValidationError('Policy subject is required for type p');
    }
    if (!policy.object) {
      throw createValidationError('Policy object is required for type p');
    }
    if (!policy.action) {
      throw createValidationError('Policy action is required for type p');
    }
  }

  if (policy.type.startsWith('g')) {
    if (!policy.subject || !policy.object) {
      throw createValidationError('Grouping policies require subject and object');
    }
  }
};

const listPolicies = (filters) => listPoliciesRepo(filters);

const createPolicy = async (payload = {}, actor = {}) => {
  const data = buildPolicyPayload(payload);
  validatePolicyPayload(data);

  const policy = await createPolicyRepo({
    ...data,
    createdById: actor.id ?? null,
  });

  await createPolicyRevision({
    policyId: policy.id,
    changeType: 'created',
    justification: payload.justification || null,
    summary: payload.summary || `Created ${policy.type} policy`,
    payload: data,
    createdById: actor.id ?? null,
  });

  logger.info('Policy created', {
    policyId: policy.id,
    type: policy.type,
    subject: policy.subject,
    domain: policy.domain,
    actorId: actor.id ?? null,
  });

  await invalidateEnforcer('policy-created');
  return policy;
};

const updatePolicy = async (id, payload = {}, actor = {}) => {
  const policy = await findPolicyById(id);
  if (!policy) {
    throw createNotFoundError('Policy not found');
  }

  const nextData = { ...policy, ...buildPolicyPayload({ ...policy, ...payload }) };
  validatePolicyPayload(nextData);

  const diff = {};
  ['type', 'subject', 'domain', 'object', 'action', 'effect', 'description', 'metadata'].forEach((key) => {
    if (!isDeepStrictEqual(policy[key], nextData[key])) {
      diff[key] = { before: policy[key], after: nextData[key] };
    }
  });

  const updated = await updatePolicyRepo(id, {
    type: nextData.type,
    subject: nextData.subject,
    domain: nextData.domain,
    object: nextData.object,
    action: nextData.action,
    effect: nextData.effect,
    description: nextData.description,
    metadata: nextData.metadata,
  });

  await createPolicyRevision({
    policyId: updated.id,
    changeType: 'updated',
    justification: payload.justification || null,
    summary: payload.summary || `Updated ${updated.type} policy`,
    payload: diff,
    createdById: actor.id ?? null,
  });

  logger.info('Policy updated', {
    policyId: updated.id,
    actorId: actor.id ?? null,
  });

  await invalidateEnforcer('policy-updated');
  return updated;
};

const deletePolicy = async (id, { soft = true, justification, summary } = {}, actor = {}) => {
  const policy = await findPolicyById(id);
  if (!policy) {
    throw createNotFoundError('Policy not found');
  }

  const deleted = await deletePolicyRepo(id, { soft });

  await createPolicyRevision({
    policyId: deleted?.id ?? policy.id,
    changeType: soft ? 'archived' : 'deleted',
    justification: justification || null,
    summary: summary || `${soft ? 'Archived' : 'Deleted'} ${policy.type} policy`,
    payload: policy,
    createdById: actor.id ?? null,
  });

  logger.info('Policy deleted', {
    policyId: policy.id,
    soft,
    actorId: actor.id ?? null,
  });

  await invalidateEnforcer('policy-deleted');
  return deleted;
};

module.exports = {
  listPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
};
