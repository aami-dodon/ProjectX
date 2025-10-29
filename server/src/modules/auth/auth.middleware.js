const jwt = require('jsonwebtoken');

const { env } = require('@/config/env');
const { createUnauthorizedError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const { findUserById } = require('./auth.repository');

const logger = createLogger('auth-middleware');

const authenticateRequest = async (req, _res, next) => {
  const authorization = req.headers.authorization || req.headers.Authorization;
  if (!authorization || typeof authorization !== 'string') {
    return next(createUnauthorizedError('Authorization header is required'));
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return next(createUnauthorizedError('Authorization header must be in the format: Bearer <token>'));
  }

  try {
    const decoded = jwt.verify(token, env.AUTH_ACCESS_TOKEN_SECRET);
    const user = await findUserById(decoded.sub);
    if (!user) {
      return next(createUnauthorizedError('Authenticated user could not be found'));
    }

    if (user.status === 'SUSPENDED') {
      logger.warn('Blocked request for suspended account', { userId: user.id });
      return next(createUnauthorizedError('Account has been suspended'));
    }

    if (user.status !== 'ACTIVE') {
      logger.warn('Blocked request for inactive account', {
        userId: user.id,
        status: user.status,
      });
      return next(createUnauthorizedError('Account is not active'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      roles: (user.roleAssignments ?? []).map((assignment) => assignment.role.name),
      status: user.status,
    };

    return next();
  } catch (error) {
    logger.warn('Failed to authenticate request', { error: error.message });
    return next(createUnauthorizedError('Invalid or expired access token'));
  }
};

const requireRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(createUnauthorizedError('Authentication is required'));
  }

  const hasRole = (req.user.roles ?? []).some((role) => allowedRoles.includes(role));
  if (!hasRole) {
    return next(createUnauthorizedError('You do not have permission to access this resource'));
  }

  return next();
};

module.exports = {
  authenticateRequest,
  requireRoles,
};
