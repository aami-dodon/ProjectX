const { transporter } = require('@/integrations/mailer');
const { env } = require('@/config/env');

const DEFAULT_SUBJECT = 'Project X Connectivity Test';
const DEFAULT_TEXT = 'This is a connectivity test email from Project X health check.';

const sendEmail = async ({ to, subject, text, html, from = env.EMAIL_FROM }) =>
  transporter.sendMail({
    to,
    from,
    subject,
    text,
    html,
  });

const sendTestEmail = async ({ to }) =>
  sendEmail({
    to,
    subject: DEFAULT_SUBJECT,
    text: DEFAULT_TEXT,
  });

module.exports = {
  sendEmail,
  sendTestEmail,
};
