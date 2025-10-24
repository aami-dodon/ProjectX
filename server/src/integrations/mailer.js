const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const { createLogger } = require('../utils/logger');

const logger = createLogger('mailer');

const transporter = nodemailer.createTransport({
  host: env.EMAIL_SMTP_HOST,
  port: env.EMAIL_SMTP_PORT,
  secure: env.EMAIL_SMTP_SECURE,
  auth: {
    user: env.EMAIL_SMTP_USER,
    pass: env.EMAIL_SMTP_PASSWORD,
  },
});

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to verify SMTP transport');
    throw error;
  }
};

module.exports = {
  transporter,
  verifyTransporter,
};
