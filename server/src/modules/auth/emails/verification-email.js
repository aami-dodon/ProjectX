const { createTemplatedEmail } = require('@/integrations/mailer');

const buildVerificationUrl = ({ appBaseUrl, token }) => {
  const url = new URL('/auth/verify-password', appBaseUrl);
  url.searchParams.set('token', token);
  return url.toString();
};

const renderVerificationEmail = ({ recipient, fullName, token, appBaseUrl }) => {
  const verificationUrl = buildVerificationUrl({ appBaseUrl, token });
  const previewName = fullName ? fullName : 'there';

  const subject = 'Verify your Project X account';
  const previewText = 'Verify your email address to activate your Project X account.';

  return createTemplatedEmail({
    to: recipient,
    subject,
    previewText,
    title: subject,
    headline: `Hi ${previewName},`,
    body: [
      {
        text: 'Thanks for registering with Project X. Please verify your email address to activate your account.',
      },
      {
        text: 'Use the button below to confirm your email address.',
      },
    ],
    cta: {
      label: 'Verify account',
      url: verificationUrl,
      fallbackText: 'If the button does not work, copy and paste this link into your browser.',
    },
    footer: 'If you did not create an account, you can safely ignore this email.',
  });
};

module.exports = {
  renderVerificationEmail,
};
