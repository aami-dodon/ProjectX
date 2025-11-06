const { createLogger } = require('@/utils/logger');
const {
  listRoles,
  createRole,
  updateRole,
  archiveRole,
  getRoleDetail,
} = require('../services/role.service');
const {
  listPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
} = require('../services/policy.service');
const { getEnforcer } = require('../rbac-enforcer');
const { createValidationError } = require('@/utils/errors');

const logger = createLogger('rbac-controller');

const parseDomain = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
};

const getRolesHandler = async (req, res, next) => {
  try {
    const { domain, includeArchived } = req.query ?? {};
    const roles = await listRoles({
      domain: parseDomain(domain) || undefined,
      includeArchived: includeArchived === 'true',
    });

    return res.json({ roles });
  } catch (error) {
    logger.error('Failed to list roles', { error: error.message });
    return next(error);
  }
};

const createRoleHandler = async (req, res, next) => {
  try {
    const role = await createRole(req.body ?? {}, req.user ?? {});
    return res.status(201).json({ role });
  } catch (error) {
    logger.error('Failed to create role', { error: error.message });
    return next(error);
  }
};

const getRoleDetailHandler = async (req, res, next) => {
  try {
    const role = await getRoleDetail(req.params.id);
    return res.json({ role });
  } catch (error) {
    logger.warn('Failed to fetch role detail', { error: error.message });
    return next(error);
  }
};

const updateRoleHandler = async (req, res, next) => {
  try {
    const role = await updateRole(req.params.id, req.body ?? {}, req.user ?? {});
    return res.json({ role });
  } catch (error) {
    logger.warn('Failed to update role', { error: error.message });
    return next(error);
  }
};

const deleteRoleHandler = async (req, res, next) => {
  try {
    const role = await archiveRole(req.params.id, req.user ?? {});
    return res.json({ role, status: 'archived' });
  } catch (error) {
    logger.warn('Failed to archive role', { error: error.message });
    return next(error);
  }
};

const listPoliciesHandler = async (req, res, next) => {
  try {
    const { domain, subject, type } = req.query ?? {};
    const policies = await listPolicies({
      domain: parseDomain(domain) || undefined,
      subject: parseDomain(subject) || undefined,
      type: type ? String(type).trim() : undefined,
    });

    return res.json({ policies });
  } catch (error) {
    logger.error('Failed to list policies', { error: error.message });
    return next(error);
  }
};

const createPolicyHandler = async (req, res, next) => {
  try {
    const policy = await createPolicy(req.body ?? {}, req.user ?? {});
    return res.status(201).json({ policy });
  } catch (error) {
    logger.warn('Failed to create policy', { error: error.message });
    return next(error);
  }
};

const updatePolicyHandler = async (req, res, next) => {
  try {
    const policy = await updatePolicy(req.params.id, req.body ?? {}, req.user ?? {});
    return res.json({ policy });
  } catch (error) {
    logger.warn('Failed to update policy', { error: error.message });
    return next(error);
  }
};

const deletePolicyHandler = async (req, res, next) => {
  try {
    const policy = await deletePolicy(
      req.params.id,
      {
        soft: (req.query?.hardDelete ?? '').toString().toLowerCase() !== 'true',
        justification: req.body?.justification,
        summary: req.body?.summary,
      },
      req.user ?? {}
    );

    return res.json({ policy, status: 'deleted' });
  } catch (error) {
    logger.warn('Failed to delete policy', { error: error.message });
    return next(error);
  }
};

const triggerAccessReviewHandler = async (req, res, next) => {
  try {
    const { domain, reason } = req.body ?? {};
    const normalizedDomain = parseDomain(domain) || 'global';

    logger.info('Access review requested', {
      domain: normalizedDomain,
      reason: reason ?? null,
      actorId: req.user?.id ?? null,
    });

    return res.status(202).json({
      status: 'scheduled',
      domain: normalizedDomain,
      message: 'Access review workflow has been queued for processing.',
    });
  } catch (error) {
    logger.warn('Failed to trigger access review', { error: error.message });
    return next(error);
  }
};

const checkPermissionHandler = async (req, res, next) => {
  try {
    const resource = parseDomain(req.body?.resource);
    const action = parseDomain(req.body?.action);
    const domain = parseDomain(req.body?.domain) || 'global';

    if (!resource) {
      throw createValidationError('resource is required');
    }

    if (!action) {
      throw createValidationError('action is required');
    }

    const enforcer = await getEnforcer();
    const allowed = await enforcer.enforce(req.user.id, domain, resource, action);

    return res.json({
      allowed,
      resource,
      action,
      domain,
    });
  } catch (error) {
    logger.warn('Failed to evaluate permission', { error: error.message });
    return next(error);
  }
};

module.exports = {
  getRolesHandler,
  createRoleHandler,
  getRoleDetailHandler,
  updateRoleHandler,
  deleteRoleHandler,
  listPoliciesHandler,
  createPolicyHandler,
  updatePolicyHandler,
  deletePolicyHandler,
  triggerAccessReviewHandler,
  checkPermissionHandler,
};
