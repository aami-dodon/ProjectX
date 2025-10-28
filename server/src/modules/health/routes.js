const express = require('express');

const {
  getHealth,
  requestStoragePresign,
  sendTestEmailFromHealth,
} = require('@/modules/health/controllers/health.controller');

const router = express.Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Get composite service health diagnostics.
 *     tags:
 *       - Health
 *     responses:
 *       '200':
 *         description: Current server, integration, and CORS status.
 */
router.get('/', getHealth);

/**
 * @openapi
 * /api/health/storage/presign:
 *   post:
 *     summary: Create a presigned upload URL for health checks.
 *     tags:
 *       - Health
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *             properties:
 *               contentType:
 *                 type: string
 *                 example: image/png
 *                 description: MIME type of the image that will be uploaded.
 *     responses:
 *       '200':
 *         description: Upload target and presigned URL details.
 */
router.post('/storage/presign', requestStoragePresign);

/**
 * @openapi
 * /api/health/email/test:
 *   post:
 *     summary: Send a test email via the health diagnostics workflow.
 *     tags:
 *       - Health
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Recipient email address that should receive the test message.
 *     responses:
 *       '200':
 *         description: Confirmation that the test email was queued.
 */
router.post('/email/test', sendTestEmailFromHealth);

module.exports = router;
