const express = require('express');

const { authenticateRequest } = require('@/modules/auth/auth.middleware');
const { attachAuditContext } = require('@/middleware/audit-context');
const { requirePermission } = require('@/middleware/authorization');
const {
  listChecks,
  createCheck,
  updateCheck,
  activateCheck,
} = require('./controllers/checks.controller');
const {
  archiveControl,
  createControl,
  getControl,
  getControlScores,
  listControls,
  triggerControlRemediationHandler,
  updateControl,
  updateControlMappings,
} = require('./controllers/controls.controller');
const {
  listResults,
  runCheck,
  publishResultHandler,
} = require('./controllers/results.controller');
const {
  listQueueItems,
  completeQueueItem,
} = require('./controllers/review-queue.controller');

const router = express.Router();

router.use(authenticateRequest, attachAuditContext);

const allowGovernanceRoles = ['admin', 'compliance officer'];

router.get(
  '/controls',
  requirePermission({
    resource: 'governance:controls',
    action: 'read',
    allowRoles: allowGovernanceRoles,
  }),
  listControls,
);

router.post(
  '/controls',
  requirePermission({
    resource: 'governance:controls',
    action: 'create',
    allowRoles: allowGovernanceRoles,
  }),
  createControl,
);

router.get(
  '/controls/:controlId',
  requirePermission({
    resource: 'governance:controls',
    action: 'read',
    allowRoles: allowGovernanceRoles,
  }),
  getControl,
);

router.patch(
  '/controls/:controlId',
  requirePermission({
    resource: 'governance:controls',
    action: 'update',
    allowRoles: allowGovernanceRoles,
  }),
  updateControl,
);

router.post(
  '/controls/:controlId/archive',
  requirePermission({
    resource: 'governance:controls',
    action: 'archive',
    allowRoles: allowGovernanceRoles,
  }),
  archiveControl,
);

router.put(
  '/controls/:controlId/mappings',
  requirePermission({
    resource: 'governance:controls:mappings',
    action: 'update',
    allowRoles: allowGovernanceRoles,
  }),
  updateControlMappings,
);

router.get(
  '/controls/:controlId/scores',
  requirePermission({
    resource: 'governance:controls',
    action: 'read',
    allowRoles: allowGovernanceRoles,
  }),
  getControlScores,
);

router.post(
  '/controls/:controlId/remediation',
  requirePermission({
    resource: 'governance:controls:remediation',
    action: 'create',
    allowRoles: allowGovernanceRoles,
  }),
  triggerControlRemediationHandler,
);

router.get(
  '/checks',
  requirePermission({
    resource: 'governance:checks',
    action: 'read',
    allowRoles: allowGovernanceRoles,
  }),
  listChecks,
);

router.post(
  '/checks',
  requirePermission({
    resource: 'governance:checks',
    action: 'create',
    allowRoles: allowGovernanceRoles,
  }),
  createCheck,
);

router.put(
  '/checks/:checkId',
  requirePermission({
    resource: 'governance:checks',
    action: 'update',
    allowRoles: allowGovernanceRoles,
  }),
  updateCheck,
);

router.post(
  '/checks/:checkId/activate',
  requirePermission({
    resource: 'governance:checks',
    action: 'activate',
    allowRoles: allowGovernanceRoles,
  }),
  activateCheck,
);

router.post(
  '/checks/:checkId/run',
  requirePermission({
    resource: 'governance:checks',
    action: 'execute',
    allowRoles: allowGovernanceRoles,
  }),
  runCheck,
);

router.get(
  '/checks/:checkId/results',
  requirePermission({
    resource: 'governance:results',
    action: 'read',
    allowRoles: allowGovernanceRoles,
  }),
  listResults,
);

router.post(
  '/results/:resultId/publish',
  requirePermission({
    resource: 'governance:results',
    action: 'publish',
    allowRoles: allowGovernanceRoles,
  }),
  publishResultHandler,
);

router.get(
  '/review-queue',
  requirePermission({
    resource: 'governance:review-queue',
    action: 'read',
    allowRoles: allowGovernanceRoles,
  }),
  listQueueItems,
);

router.post(
  '/review-queue/:itemId/complete',
  requirePermission({
    resource: 'governance:review-queue',
    action: 'complete',
    allowRoles: allowGovernanceRoles,
  }),
  completeQueueItem,
);

module.exports = router;
