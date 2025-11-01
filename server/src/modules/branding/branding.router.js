const express = require('express');

const { authenticateRequest, requireRoles } = require('@/modules/auth/auth.middleware');
const { attachAuditContext } = require('@/middleware/audit-context');
const { fetchBranding, saveBranding } = require('./branding.controller');

const router = express.Router();

router.get('/', fetchBranding);
router.put('/', authenticateRequest, attachAuditContext, requireRoles('admin'), saveBranding);

module.exports = router;
