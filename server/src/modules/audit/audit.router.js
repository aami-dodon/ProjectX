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
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of records to skip before starting to collect the result set. Defaults to 0.
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Filter logs for a specific audited model/table name.
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE]
 *         description: Restrict logs to a single action type.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive match against actions, models, record IDs, IPs, and user identities.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Include logs created on or after this timestamp.
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Include logs created on or before this timestamp.
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
 *                 total:
 *                   type: integer
 *                   description: Total number of logs that match the provided filters.
 *                 limit:
 *                   type: integer
 *                   description: The resolved page size applied to the query.
 *                 offset:
 *                   type: integer
 *                   description: The resolved offset applied to the query.
 */
router.get('/', listRecentAuditLogs);

module.exports = router;
