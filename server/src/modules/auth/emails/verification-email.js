const buildVerificationUrl = ({ appBaseUrl, token }) => {
  const url = new URL('/auth/verify-password', appBaseUrl);
  url.searchParams.set('token', token);
  return url.toString();
};

const renderVerificationEmail = ({ recipient, fullName, token, appBaseUrl }) => {
  const verificationUrl = buildVerificationUrl({ appBaseUrl, token });
  const previewName = fullName ? fullName : 'there';

  const subject = 'Verify your Project X account';
  const text = [
    `Hi ${previewName},`,
    '',
    'Thanks for registering with Project X. Please verify your email address to activate your account.',
    `Verification link: ${verificationUrl}`,
    '',
    'If you did not create an account you can safely ignore this email.',
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #0f172a;">
    <p>Hi ${previewName},</p>
    <p>Thanks for registering with <strong>Project X</strong>. Please verify your email address to activate your account.</p>
    <p style="margin: 16px 0;">
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;">Verify account</a>
    </p>
    <p>If the button does not work, copy and paste the following link into your browser:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p style="color: #64748b;">If you did not create an account, you can safely ignore this email.</p>
  </body>
</html>`;

  return {
    to: recipient,
    subject,
    text,
    html,
  };
};

module.exports = {
  renderVerificationEmail,
};
