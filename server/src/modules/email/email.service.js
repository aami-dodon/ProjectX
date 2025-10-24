const { sendTestEmail } = require('../../integrations/mailer');
const { requireShared } = require('../../utils/sharedModule');

const { createValidationError } = requireShared('error-handling');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requestTestEmail = async ({ to, metadata }) => {
  if (!to || !EMAIL_REGEX.test(to)) {
    throw createValidationError('A valid recipient email address is required', { field: 'to' });
  }

  await sendTestEmail(to, metadata);

  return { deliveredTo: to };
};

module.exports = {
  requestTestEmail,
};
