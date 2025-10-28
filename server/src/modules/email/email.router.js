const express = require('express');

const { sendTestEmailHandler } = require('@/modules/email/email.controller');

const router = express.Router();

/**
 * @openapi
 * /api/email/test:
 *   post:
 *     tags:
 *       - Email
 *     summary: Send a connectivity test email.
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
 *                 description: Recipient email address.
 *     responses:
 *       '200':
 *         description: Confirmation that the test email was sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 messageId:
 *                   type: string
 *                   nullable: true
 *       '400':
 *         description: The recipient email is missing.
 *       '500':
 *         description: Failed to send the test email.
 */
router.post('/test', sendTestEmailHandler);

module.exports = router;
