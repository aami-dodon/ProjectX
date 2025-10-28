const express = require('express');
const { createValidationError, createIntegrationError } = require('@/utils/error-handling');
const { sendTestEmail } = require('@/modules/email/email.service');

const router = express.Router();

/**
 * @openapi
 * /api/email/test:
 *   post:
 *     summary: Send a smoke-test email using the configured SMTP transport.
 *     description: Useful for operations engineers to verify SMTP connectivity without touching application workflows.
 *     tags:
 *       - Email
 *     security: []
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *               properties:
 *                 status:
 *                   type: string
 *                   example: sent
 *                 messageId:
 *                   type: string
 *                   nullable: true
 *                   description: Nodemailer-generated identifier for the message.
 *       '400':
 *         description: The request did not include a valid recipient address.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     code:
 *                       type: string
 *                     details:
 *                       nullable: true
 *                     requestId:
 *                       nullable: true
 *                     traceId:
 *                       nullable: true
 *       '502':
 *         description: The SMTP transport rejected the message or was unavailable.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     code:
 *                       type: string
 *                     details:
 *                       nullable: true
 *                     requestId:
 *                       nullable: true
 *                     traceId:
 *                       nullable: true
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
