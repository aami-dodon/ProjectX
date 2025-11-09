const express = require('express');

const { authenticateRequest } = require('@/modules/auth/auth.middleware');
const { attachAuditContext } = require('@/middleware/audit-context');
const { requirePermission } = require('@/middleware/authorization');
const { requestUpload } = require('./controllers/upload.controller');
const { requestDownload } = require('./controllers/download.controller');
const {
  addLinks,
  getEvidence,
  listEvidence,
  removeLink,
  retentionSummary,
  updateMetadata,
} = require('./controllers/metadata.controller');

const router = express.Router();

router.use(authenticateRequest, attachAuditContext);

const allowEvidenceAdmins = ['admin', 'compliance officer'];

router.get(
  '/retention',
  requirePermission({
    resource: 'evidence:retention',
    action: 'read',
    allowRoles: allowEvidenceAdmins,
  }),
  retentionSummary,
);

router.post(
  '/upload',
  requirePermission({
    resource: 'evidence:records',
    action: 'create',
    allowRoles: allowEvidenceAdmins,
  }),
  requestUpload,
);

router.get(
  '/',
  requirePermission({
    resource: 'evidence:records',
    action: 'read',
    allowRoles: allowEvidenceAdmins,
  }),
  listEvidence,
);

router.get(
  '/:evidenceId/download',
  requirePermission({
    resource: 'evidence:records',
    action: 'read',
    allowRoles: allowEvidenceAdmins,
  }),
  requestDownload,
);

router.put(
  '/:evidenceId/metadata',
  requirePermission({
    resource: 'evidence:records',
    action: 'update',
    allowRoles: allowEvidenceAdmins,
  }),
  updateMetadata,
);

router.post(
  '/:evidenceId/links',
  requirePermission({
    resource: 'evidence:links',
    action: 'update',
    allowRoles: allowEvidenceAdmins,
  }),
  addLinks,
);

router.delete(
  '/:evidenceId/links/:linkId',
  requirePermission({
    resource: 'evidence:links',
    action: 'update',
    allowRoles: allowEvidenceAdmins,
  }),
  removeLink,
);

router.get(
  '/:evidenceId',
  requirePermission({
    resource: 'evidence:records',
    action: 'read',
    allowRoles: allowEvidenceAdmins,
  }),
  getEvidence,
);

module.exports = router;
