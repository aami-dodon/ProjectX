const express = require('express');

const { authenticateRequest } = require('@/modules/auth/auth.middleware');
const { attachAuditContext } = require('@/middleware/audit-context');
const { requirePermission } = require('@/middleware/authorization');
const {
  getFrameworkScoresHandler,
  getControlHealthHandler,
  getRemediationDashboardHandler,
  getEvidenceDashboardHandler,
} = require('./controllers/dashboards.controller');
const {
  createExportHandler,
  getExportHandler,
  retryExportHandler,
} = require('./controllers/exports.controller');
const { REPORT_RESOURCES } = require('./policies/reports.policy');

const router = express.Router();

const DASHBOARD_ROLES = ['admin', 'compliance officer', 'auditor', 'executive'];
const EXPORT_ROLES = ['admin', 'compliance officer'];

router.use(authenticateRequest, attachAuditContext);

router.get(
  '/dashboards/framework-scores',
  requirePermission({ resource: REPORT_RESOURCES.DASHBOARDS, action: 'read', allowRoles: DASHBOARD_ROLES }),
  getFrameworkScoresHandler,
);

router.get(
  '/dashboards/control-health',
  requirePermission({ resource: REPORT_RESOURCES.DASHBOARDS, action: 'read', allowRoles: DASHBOARD_ROLES }),
  getControlHealthHandler,
);

router.get(
  '/dashboards/remediation',
  requirePermission({ resource: REPORT_RESOURCES.DASHBOARDS, action: 'read', allowRoles: DASHBOARD_ROLES }),
  getRemediationDashboardHandler,
);

router.get(
  '/dashboards/evidence',
  requirePermission({ resource: REPORT_RESOURCES.DASHBOARDS, action: 'read', allowRoles: DASHBOARD_ROLES }),
  getEvidenceDashboardHandler,
);

router.post(
  '/exports',
  requirePermission({ resource: REPORT_RESOURCES.EXPORTS, action: 'create', allowRoles: EXPORT_ROLES }),
  createExportHandler,
);

router.get(
  '/exports/:exportId',
  requirePermission({ resource: REPORT_RESOURCES.EXPORTS, action: 'read', allowRoles: EXPORT_ROLES }),
  getExportHandler,
);

router.post(
  '/exports/:exportId/retry',
  requirePermission({ resource: REPORT_RESOURCES.EXPORTS, action: 'update', allowRoles: EXPORT_ROLES }),
  retryExportHandler,
);

module.exports = {
  router,
};
