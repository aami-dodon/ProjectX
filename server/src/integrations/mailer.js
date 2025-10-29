const nodemailer = require('nodemailer');
const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('mailer');

const transporter = nodemailer.createTransport({
  host: env.EMAIL_SMTP_HOST,
  port: env.EMAIL_SMTP_PORT,
  secure: env.EMAIL_SMTP_SECURE,
  auth: {
    user: env.EMAIL_SMTP_USER,
    pass: env.EMAIL_SMTP_PASS,
  },
});

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    logger.error('Failed to verify SMTP transport', { error: error.message });
    throw error;
  }
};

const sendMail = async (message) => {
  const payload = {
    from: env.EMAIL_FROM,
    ...message,
  };

  try {
    const info = await transporter.sendMail(payload);
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: payload.to,
      subject: payload.subject,
    });
    return info;
  } catch (error) {
    logger.error('Failed to send email', {
      error: error.message,
      to: payload.to,
      subject: payload.subject,
    });
    throw error;
  }
};

module.exports = {
  transporter,
  verifyTransporter,
  sendMail,
};
