const router = require('./auth.router');
const { authenticateRequest, requireRoles } = require('./auth.middleware');

module.exports = {
  router,
  authenticateRequest,
  requireRoles,
};
