const { createLogger } = require('@/utils/logger');
const {
  listRoles: listRolesRepo,
  createRole: createRoleRepo,
  updateRole: updateRoleRepo,
  archiveRole: archiveRoleRepo,
  findRoleById,
  listRoleAssignments,
} = require('../repositories/role.repository');
const { listPolicies } = require('../repositories/policy.repository');
const { invalidateEnforcer } = require('../rbac-enforcer');
const {
  createValidationError,
  createNotFoundError,
} = require('@/utils/errors');

const logger = createLogger('role-service');

const normalizeString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const listRoles = async (options = {}) => {
  const roles = await listRolesRepo(options);
  return roles.map(({ _count, ...rest }) => ({
    ...rest,
    assignmentCount: _count?.assignments ?? 0,
  }));
};

const createRole = async (payload = {}, actor = {}) => {
  const name = normalizeString(payload.name);
  if (!name) {
    throw createValidationError('Role name is required');
  }

  const domain = normalizeString(payload.domain) || 'global';

  const role = await createRoleRepo({
    name,
    description: normalizeString(payload.description) || null,
    tenantId: normalizeString(payload.tenantId) || null,
    domain,
    inheritsRoleId: normalizeString(payload.inheritsRoleId) || null,
    reviewCadenceDays: Number.isInteger(payload.reviewCadenceDays)
      ? payload.reviewCadenceDays
      : null,
    metadata: payload.metadata ?? null,
    isSystemDefault: Boolean(payload.isSystemDefault),
  });

  logger.info('Role created', {
    roleId: role.id,
    name: role.name,
    domain: role.domain,
    actorId: actor.id ?? null,
  });

  await invalidateEnforcer('role-created');
  return role;
};

const updateRole = async (id, payload = {}, actor = {}) => {
  const role = await findRoleById(id);
  if (!role) {
    throw createNotFoundError('Role not found');
  }

  const data = {};
  if (payload.name !== undefined) {
    const normalized = normalizeString(payload.name);
    if (!normalized) {
      throw createValidationError('Role name cannot be empty');
    }
    data.name = normalized;
  }

  if (payload.description !== undefined) {
    data.description = normalizeString(payload.description) || null;
  }

  if (payload.domain !== undefined) {
    data.domain = normalizeString(payload.domain) || null;
  }

  if (payload.inheritsRoleId !== undefined) {
    const normalized = normalizeString(payload.inheritsRoleId) || null;
    data.inheritsRoleId = normalized || null;
  }

  if (payload.reviewCadenceDays !== undefined) {
    if (payload.reviewCadenceDays === null) {
      data.reviewCadenceDays = null;
    } else if (Number.isInteger(payload.reviewCadenceDays) && payload.reviewCadenceDays >= 0) {
      data.reviewCadenceDays = payload.reviewCadenceDays;
    } else {
      throw createValidationError('reviewCadenceDays must be a non-negative integer or null');
    }
  }

  if (payload.metadata !== undefined) {
    data.metadata = payload.metadata ?? null;
  }

  if (payload.archivedAt !== undefined) {
    data.archivedAt = payload.archivedAt;
  }

  const updated = await updateRoleRepo(id, data);

  logger.info('Role updated', {
    roleId: updated.id,
    actorId: actor.id ?? null,
  });

  await invalidateEnforcer('role-updated');
  return updated;
};

const archiveRole = async (id, actor = {}) => {
  const role = await findRoleById(id);
  if (!role) {
    throw createNotFoundError('Role not found');
  }

  const archived = await archiveRoleRepo(id);

  logger.info('Role archived', {
    roleId: archived.id,
    actorId: actor.id ?? null,
  });

  await invalidateEnforcer('role-archived');
  return archived;
};

const getRoleDetail = async (id) => {
  const role = await findRoleById(id);
  if (!role) {
    throw createNotFoundError('Role not found');
  }

  const policies = await listPolicies({
    subject: role.name,
    domain: role.domain ?? 'global',
  });

  const assignments = await listRoleAssignments(id);

  return {
    ...role,
    policies,
    assignments,
  };
};

module.exports = {
  listRoles,
  createRole,
  updateRole,
  archiveRole,
  getRoleDetail,
};
