const express = require('express');
const { createValidationError, createIntegrationError } = require('../../utils/error-handling);
const { sendTestEmail } = require('./email.service');

const router = express.Router();

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
