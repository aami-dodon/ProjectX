const express = require('express');

const { authenticateRequest, requireRoles } = require('@/modules/auth/auth.middleware');
const { attachAuditContext } = require('@/middleware/audit-context');
const { listRecentAuditLogs } = require('./audit.controller');

const router = express.Router();

router.use(authenticateRequest, attachAuditContext);
router.use(requireRoles('admin'));

/**
 * @openapi
 * /api/audit:
 *   get:
 *     summary: Retrieve recent audit log entries.
 *     description: Returns the most recent audit trail entries ordered by creation time. Requires admin access.
 *     tags:
 *       - Audit
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *         description: Maximum number of records to return. Defaults to 50.
 *     responses:
 *       '200':
 *         description: Collection of audit log entries.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 */
router.get('/', listRecentAuditLogs);

module.exports = router;
