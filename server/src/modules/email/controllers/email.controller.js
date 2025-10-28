const { sendTestEmail } = require('@/modules/email/email.service');
const { createLogger } = require('@/utils/logger');
const { createValidationError, createIntegrationError } = require('@/utils/error-handling');

const logger = createLogger('email-controller');

const sendTestEmailHandler = async (req, res, next) => {
  const { to } = req.body ?? {};

  if (!to || typeof to !== 'string') {
    return next(createValidationError('Recipient email is required'));
  }

  try {
    const info = await sendTestEmail({ to });

    return res.json({
      status: 'sent',
      messageId: info?.messageId ?? null,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to send test email');
    return next(createIntegrationError('Failed to send test email', { cause: error.message }));
  }
};

module.exports = {
  sendTestEmailHandler,
};
