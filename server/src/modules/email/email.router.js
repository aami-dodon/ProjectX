const express = require('express');
const { createValidationError, createIntegrationError } = require('@/utils/error-handling');
const { sendTestEmail } = require('@/modules/email/email.service');

const router = express.Router();

/**
 * @openapi
 * /api/email/test:
 *   post:
 *     summary: Send a smoke-test email using the configured SMTP transport.
 *     tags:
 *       - Email
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
 *                 description: Destination inbox for the test email.
 *     responses:
 *       '200':
 *         description: Identifiers for the enqueued email message.
 */
router.post('/test', async (req, res, next) => {
  const { to } = req.body ?? {};

  if (!to || typeof to !== 'string') {
    return next(createValidationError('Recipient email is required'));
  }

  try {
    const info = await sendTestEmail({ to });

    return res.json({
      status: 'sent',
      messageId: info.messageId,
    });
  } catch (error) {
    return next(createIntegrationError('Failed to send test email', { cause: error.message }));
  }
});

module.exports = router;
