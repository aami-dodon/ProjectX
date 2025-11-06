const router = require('./auth.router');
const { authenticateRequest, requireRoles } = require('./auth.middleware');
const { requirePermission } = require('@/middleware/authorization');

module.exports = {
  router,
  authenticateRequest,
  requireRoles,
  requirePermission,
};
