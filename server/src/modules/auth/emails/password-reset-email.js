const buildResetUrl = ({ appBaseUrl, token }) => {
  const url = new URL('/auth/reset-password', appBaseUrl);
  url.searchParams.set('token', token);
  return url.toString();
};

const renderPasswordResetEmail = ({ recipient, fullName, token, appBaseUrl }) => {
  const resetUrl = buildResetUrl({ appBaseUrl, token });
  const previewName = fullName ? fullName : 'there';

  const subject = 'Reset your Project X password';
  const text = [
    `Hi ${previewName},`,
    '',
    'We received a request to reset the password for your Project X account. Use the link below to set a new password.',
    `Reset link: ${resetUrl}`,
    '',
    'If you did not request a password reset, you can safely ignore this message.',
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #0f172a;">
    <p>Hi ${previewName},</p>
    <p>We received a request to reset the password for your <strong>Project X</strong> account. Use the link below to set a new password.</p>
    <p style="margin: 16px 0;">
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px;">Reset password</a>
    </p>
    <p>If the button does not work, copy and paste the following link into your browser:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p style="color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
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
  renderPasswordResetEmail,
};
