const express = require('express');

const { authenticateRequest } = require('../auth.middleware');
const { attachAuditContext } = require('@/middleware/audit-context');
const { requirePermission } = require('@/middleware/authorization');
const {
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
} = require('../controllers/rbac.controller');

const router = express.Router();

router.use(authenticateRequest, attachAuditContext);

router.post('/permissions/check', checkPermissionHandler);

router
  .route('/roles')
  .get(requirePermission({ resource: 'rbac:roles', action: 'read', allowRoles: ['admin'] }), getRolesHandler)
  .post(requirePermission({ resource: 'rbac:roles', action: 'create', allowRoles: ['admin'] }), createRoleHandler);

router
  .route('/roles/:id')
  .get(requirePermission({ resource: 'rbac:roles', action: 'read', allowRoles: ['admin'] }), getRoleDetailHandler)
  .patch(requirePermission({ resource: 'rbac:roles', action: 'update', allowRoles: ['admin'] }), updateRoleHandler)
  .delete(requirePermission({ resource: 'rbac:roles', action: 'delete', allowRoles: ['admin'] }), deleteRoleHandler);

router
  .route('/policies')
  .get(requirePermission({ resource: 'rbac:policies', action: 'read', allowRoles: ['admin'] }), listPoliciesHandler)
  .post(requirePermission({ resource: 'rbac:policies', action: 'create', allowRoles: ['admin'] }), createPolicyHandler);

router
  .route('/policies/:id')
  .patch(requirePermission({ resource: 'rbac:policies', action: 'update', allowRoles: ['admin'] }), updatePolicyHandler)
  .delete(requirePermission({ resource: 'rbac:policies', action: 'delete', allowRoles: ['admin'] }), deletePolicyHandler);

router.post(
  '/access-reviews',
  requirePermission({ resource: 'rbac:access-review', action: 'launch', allowRoles: ['admin', 'compliance officer'] }),
  triggerAccessReviewHandler
);

module.exports = router;
