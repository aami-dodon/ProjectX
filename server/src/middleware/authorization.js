const { createUnauthorizedError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const { getEnforcer } = require('@/modules/auth/rbac-enforcer');

const logger = createLogger('authorization-middleware');

const normalize = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const defaultDomainResolver = (req) => {
  const headerDomain = normalize(req.headers['x-tenant-id']) || normalize(req.headers['x-domain']);
  if (headerDomain) {
    return headerDomain;
  }

  if (typeof req.params?.tenantId === 'string' && req.params.tenantId.trim()) {
    return req.params.tenantId.trim();
  }

  return 'global';
};

const userHasRole = (req, allowedRoles = []) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return false;
  }

  const normalizedAllowed = allowedRoles.map((role) => normalize(role).toLowerCase()).filter(Boolean);
  const userRoles = (req.user?.roles ?? []).map((role) => normalize(role).toLowerCase()).filter(Boolean);

  return userRoles.some((role) => normalizedAllowed.includes(role));
};

const requirePermission = ({
  resource,
  action,
  allowRoles = [],
  domainResolver = defaultDomainResolver,
}) => {
  if (!resource || !action) {
    throw new Error('requirePermission requires both resource and action');
  }

  return async (req, _res, next) => {
    if (!req.user?.id) {
      return next(createUnauthorizedError('Authentication required'));
    }

    if (userHasRole(req, allowRoles)) {
      return next();
    }

    let domain;
    try {
      domain = domainResolver ? await Promise.resolve(domainResolver(req)) : defaultDomainResolver(req);
    } catch (error) {
      logger.warn('Domain resolver threw an error', { error: error.message });
      return next(createUnauthorizedError('Unable to determine authorization domain'));
    }

    const normalizedDomain = normalize(domain) || 'global';

    try {
      const enforcer = await getEnforcer();
      const allowed = await enforcer.enforce(req.user.id, normalizedDomain, resource, action);

      if (!allowed) {
        logger.warn('Authorization denied', {
          userId: req.user.id,
          resource,
          action,
          domain: normalizedDomain,
        });
        return next(createUnauthorizedError('You do not have permission to perform this action'));
      }

      return next();
    } catch (error) {
      logger.error('Authorization middleware failed', {
        error: error.message,
        resource,
        action,
      });
      return next(createUnauthorizedError('Authorization check failed'));
    }
  };
};

module.exports = {
  requirePermission,
};
