const express = require('express');

const { authenticateRequest } = require('@/modules/auth/auth.middleware');
const { attachAuditContext } = require('@/middleware/audit-context');
const { requirePermission } = require('@/middleware/authorization');
const {
  listTasksHandler,
  createTaskHandler,
  getTaskHandler,
  updateTaskHandler,
  getTaskTimelineHandler,
  attachTaskEvidenceHandler,
  getTaskSlaSummaryHandler,
} = require('./controllers/tasks.controller');
const {
  assignTaskHandler,
  revokeAssignmentHandler,
} = require('./controllers/assignments.controller');
const { syncTaskIntegrationHandler } = require('./controllers/integrations.controller');
const { TASK_RESOURCES } = require('./policies/tasks.policy');

const router = express.Router();
const ALLOWED_ROLES = ['admin', 'compliance officer', 'operator'];

router.use(authenticateRequest, attachAuditContext);

router.get(
  '/metrics/sla',
  requirePermission({
    resource: TASK_RESOURCES.METRICS,
    action: 'read',
    allowRoles: ALLOWED_ROLES,
  }),
  getTaskSlaSummaryHandler,
);

router.get(
  '/',
  requirePermission({
    resource: TASK_RESOURCES.RECORDS,
    action: 'read',
    allowRoles: ALLOWED_ROLES,
  }),
  listTasksHandler,
);

router.post(
  '/',
  requirePermission({
    resource: TASK_RESOURCES.RECORDS,
    action: 'create',
    allowRoles: ALLOWED_ROLES,
  }),
  createTaskHandler,
);

router.get(
  '/:taskId',
  requirePermission({
    resource: TASK_RESOURCES.RECORDS,
    action: 'read',
    allowRoles: ALLOWED_ROLES,
  }),
  getTaskHandler,
);

router.patch(
  '/:taskId',
  requirePermission({
    resource: TASK_RESOURCES.RECORDS,
    action: 'update',
    allowRoles: ALLOWED_ROLES,
  }),
  updateTaskHandler,
);

router.get(
  '/:taskId/timeline',
  requirePermission({
    resource: TASK_RESOURCES.RECORDS,
    action: 'read',
    allowRoles: ALLOWED_ROLES,
  }),
  getTaskTimelineHandler,
);

router.post(
  '/:taskId/evidence',
  requirePermission({
    resource: TASK_RESOURCES.EVIDENCE,
    action: 'update',
    allowRoles: ALLOWED_ROLES,
  }),
  attachTaskEvidenceHandler,
);

router.post(
  '/:taskId/assignments',
  requirePermission({
    resource: TASK_RESOURCES.ASSIGNMENTS,
    action: 'update',
    allowRoles: ALLOWED_ROLES,
  }),
  assignTaskHandler,
);

router.post(
  '/assignments/:assignmentId/revoke',
  requirePermission({
    resource: TASK_RESOURCES.ASSIGNMENTS,
    action: 'update',
    allowRoles: ALLOWED_ROLES,
  }),
  revokeAssignmentHandler,
);

router.post(
  '/:taskId/integrations/sync',
  requirePermission({
    resource: TASK_RESOURCES.INTEGRATIONS,
    action: 'sync',
    allowRoles: ALLOWED_ROLES,
  }),
  syncTaskIntegrationHandler,
);

module.exports = {
  router,
};
