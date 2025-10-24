const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');
const { createLogger } = require('../utils/logger');

const logger = createLogger('env');

const envPath = path.resolve(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

const EnvSchema = z
  .object({
    NODE_ENV: z.string().min(1),
    SERVER_HOST: z.string().min(1),
    SERVER_PORT: z.string().transform((value) => {
      const port = Number.parseInt(value, 10);
      if (Number.isNaN(port) || port <= 0) {
        throw new Error('SERVER_PORT must be a positive integer');
      }
      return port;
    }),
    DATABASE_URL: z.string().url(),
    MINIO_ENDPOINT: z.string().min(1),
    MINIO_PORT: z.string().transform((value) => {
      const port = Number.parseInt(value, 10);
      if (Number.isNaN(port) || port <= 0) {
        throw new Error('MINIO_PORT must be a positive integer');
      }
      return port;
    }),
    MINIO_USE_SSL: z.string().transform((value) => value === 'true'),
    MINIO_ACCESS_KEY: z.string().min(1),
    MINIO_SECRET_KEY: z.string().min(1),
    MINIO_REGION: z.string().min(1),
    MINIO_BUCKET: z.string().min(1),
    MINIO_PRESIGNED_URL_EXPIRY_SECONDS: z.string().transform((value) => {
      const seconds = Number.parseInt(value, 10);
      if (Number.isNaN(seconds) || seconds <= 0) {
        throw new Error('MINIO_PRESIGNED_URL_EXPIRY_SECONDS must be a positive integer');
      }
      return seconds;
    }),
    MINIO_CORS_ALLOWED_ORIGINS: z.string().min(1),
    EMAIL_SMTP_HOST: z.string().min(1),
    EMAIL_SMTP_PORT: z.string().transform((value) => {
      const port = Number.parseInt(value, 10);
      if (Number.isNaN(port) || port <= 0) {
        throw new Error('EMAIL_SMTP_PORT must be a positive integer');
      }
      return port;
    }),
    EMAIL_SMTP_SECURE: z.string().transform((value) => value === 'true'),
    EMAIL_SMTP_USER: z.string().min(1),
    EMAIL_SMTP_PASSWORD: z.string().min(1),
    EMAIL_FROM_ADDRESS: z.string().min(1),
  })
  .transform((env) => ({
    ...env,
    MINIO_CORS_ALLOWED_ORIGINS: env.MINIO_CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
  }));

const parseEnvironment = () => {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      logger.error({ code: 'ENV_VALIDATION_FAILED', detail: issue }, issue.message);
    });

    if (process.env.NODE_ENV === 'test') {
      throw new Error('Environment validation failed');
    }

    // Fail fast if env validation fails
    process.exit(1);
  }

  return result.data;
};

const env = parseEnvironment();

module.exports = {
  env,
};
