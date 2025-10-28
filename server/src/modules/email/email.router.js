const express = require('express');
const { transporter } = require('../../integrations/mailer');
const { env } = require('../../config/env');
const { createValidationError, createIntegrationError } = require('../../../../shared/error-handling');

const router = express.Router();

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
