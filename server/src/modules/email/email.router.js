const express = require('express');
const { transporter } = require('../../integrations/mailer');
const { env } = require('../../config/env');
const { createValidationError, createIntegrationError } = require('../../../../shared/error-handling');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Email
 *     description: SMTP connectivity utilities.
 */

/**
 * @swagger
 * /api/v1/email/test:
 *   post:
 *     summary: Send a transactional email connectivity test message.
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailTestRequest'
 *     responses:
 *       200:
 *         description: SMTP message dispatched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailTestResponse'
 *       400:
 *         description: Missing or invalid request payload.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: Upstream email provider rejected the message.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/test', async (req, res, next) => {
  const { to } = req.body ?? {};

  if (!to || typeof to !== 'string') {
    return next(createValidationError('Recipient email is required'));
  }

  try {
    const info = await transporter.sendMail({
      to,
      from: env.EMAIL_FROM,
      subject: 'Project X Connectivity Test',
      text: 'This is a connectivity test email from Project X health check.',
    });

    return res.json({
      status: 'sent',
      messageId: info.messageId,
    });
  } catch (error) {
    return next(createIntegrationError('Failed to send test email', { cause: error.message }));
  }
});

module.exports = router;
