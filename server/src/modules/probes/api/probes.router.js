const express = require('express');

const { authenticateRequest } = require('@/modules/auth/auth.middleware');
const { requirePermission } = require('@/middleware/authorization');
const { attachAuditContext } = require('@/middleware/audit-context');
const {
  createProbeHandler,
  getProbeHandler,
  getProbeMetricsHandler,
  listProbesHandler,
  runProbeHandler,
} = require('@/modules/probes/api/probes.controller');
const {
  createDeploymentHandler,
  listDeploymentsHandler,
} = require('@/modules/probes/api/deployments.controller');
const {
  createScheduleHandler,
  listSchedulesHandler,
} = require('@/modules/probes/api/schedules.controller');

const router = express.Router();

router.use(authenticateRequest);
router.use(attachAuditContext);

router
  .route('/')
  .get(
    requirePermission({
      resource: 'probes:registry',
      action: 'read',
      allowRoles: ['admin', 'compliance officer', 'engineer'],
    }),
    listProbesHandler,
  )
  .post(
    requirePermission({
      resource: 'probes:registry',
      action: 'create',
      allowRoles: ['admin', 'engineer'],
    }),
    createProbeHandler,
  );

router
  .route('/:probeId')
  .get(
    requirePermission({
      resource: 'probes:registry',
      action: 'read',
      allowRoles: ['admin', 'compliance officer', 'engineer'],
    }),
    getProbeHandler,
  );

router
  .route('/:probeId/metrics')
  .get(
    requirePermission({
      resource: 'probes:metrics',
      action: 'read',
      allowRoles: ['admin', 'compliance officer', 'engineer'],
    }),
    getProbeMetricsHandler,
  );

router
  .route('/:probeId/run')
  .post(
    requirePermission({
      resource: 'probes:runs',
      action: 'execute',
      allowRoles: ['admin', 'compliance officer'],
    }),
    runProbeHandler,
  );

router
  .route('/:probeId/deployments')
  .get(
    requirePermission({
      resource: 'probes:deployments',
      action: 'read',
      allowRoles: ['admin', 'compliance officer', 'engineer'],
    }),
    listDeploymentsHandler,
  )
  .post(
    requirePermission({
      resource: 'probes:deployments',
      action: 'create',
      allowRoles: ['admin', 'engineer'],
    }),
    createDeploymentHandler,
  );

router
  .route('/:probeId/schedules')
  .get(
    requirePermission({
      resource: 'probes:schedules',
      action: 'read',
      allowRoles: ['admin', 'compliance officer'],
    }),
    listSchedulesHandler,
  )
  .post(
    requirePermission({
      resource: 'probes:schedules',
      action: 'create',
      allowRoles: ['admin', 'compliance officer'],
    }),
    createScheduleHandler,
  );

module.exports = router;
