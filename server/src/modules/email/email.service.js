const { transporter } = require('@/integrations/mailer');
const { env } = require('@/config/env');

const sendTestEmail = async ({ to }) =>
  transporter.sendMail({
    to,
    from: env.EMAIL_FROM,
    subject: 'Project X Connectivity Test',
    text: 'This is a connectivity test email from Project X health check.',
  });

module.exports = {
  sendTestEmail,
};
