const { createTemplatedEmail } = require('@/integrations/mailer');

const buildResetUrl = ({ appBaseUrl, token }) => {
  const url = new URL('/auth/reset-password', appBaseUrl);
  url.searchParams.set('token', token);
  return url.toString();
};

const renderPasswordResetEmail = ({ recipient, fullName, token, appBaseUrl }) => {
  const resetUrl = buildResetUrl({ appBaseUrl, token });
  const previewName = fullName ? fullName : 'there';

  const subject = 'Reset your Project X password';
  const previewText = 'Reset your Project X password with the secure link below.';

  return createTemplatedEmail({
    to: recipient,
    subject,
    previewText,
    title: subject,
    headline: `Hi ${previewName},`,
    body: [
      {
        text: 'We received a request to reset the password for your Project X account.',
      },
      {
        text: 'Use the button below to set a new password. The link will expire shortly for security reasons.',
      },
    ],
    cta: {
      label: 'Reset password',
      url: resetUrl,
      fallbackText: 'If the button does not work, copy and paste this link into your browser.',
    },
    footer: 'If you did not request a password reset, you can safely ignore this email.',
  });
};

module.exports = {
  renderPasswordResetEmail,
};
