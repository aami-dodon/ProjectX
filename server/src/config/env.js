const { config: loadEnvConfig } = require('dotenv');
const { z } = require('zod');
const { createLogger } = require('@/utils/logger');

loadEnvConfig();

const DEFAULT_NODE_ENV = 'development';

if (!process.env.NODE_ENV || process.env.NODE_ENV.trim().length === 0) {
  process.env.NODE_ENV = DEFAULT_NODE_ENV;
}

const logger = createLogger('env');

const splitCommaSeparated = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const defaults = {
  NODE_ENV: DEFAULT_NODE_ENV,
  SERVER_PORT: '5000',
  CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/projectx',
  MINIO_ENDPOINT: 'localhost',
  MINIO_PORT: '9000',
  MINIO_USE_SSL: 'false',
  MINIO_ACCESS_KEY: 'minioadmin',
  MINIO_SECRET_KEY: 'minioadmin',
  MINIO_REGION: 'us-east-1',
  MINIO_BUCKET: 'evidence',
  MINIO_PRESIGNED_URL_EXPIRATION_SECONDS: '900',
  EMAIL_FROM: 'no-reply@projectx.local',
  EMAIL_SMTP_HOST: 'localhost',
  EMAIL_SMTP_PORT: '1025',
  EMAIL_SMTP_SECURE: 'false',
  EMAIL_SMTP_USER: 'smtp-user',
  EMAIL_SMTP_PASS: 'smtp-pass',
  CLIENT_PORT: '5173',
  CLIENT_ALLOWED_HOSTS: 'localhost',
  VITE_API_URL: 'http://localhost:5000/api',
};

const EnvSchema = z.object({
  NODE_ENV: z.string().min(1, { message: 'NODE_ENV must be defined' }),
  SERVER_PORT: z
    .coerce.number({ invalid_type_error: 'SERVER_PORT must be a valid number' })
    .int()
    .positive({ message: 'SERVER_PORT must be a positive integer' }),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .min(1, { message: 'CORS_ALLOWED_ORIGINS must be defined' })
    .transform(splitCommaSeparated),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
  MINIO_ENDPOINT: z.string().min(1, { message: 'MINIO_ENDPOINT must be defined' }),
  MINIO_PORT: z
    .coerce.number({ invalid_type_error: 'MINIO_PORT must be a valid number' })
    .int()
    .positive({ message: 'MINIO_PORT must be a positive integer' }),
  MINIO_USE_SSL: z.enum(['true', 'false']).transform((value) => value === 'true'),
  MINIO_ACCESS_KEY: z.string().min(1, { message: 'MINIO_ACCESS_KEY must be defined' }),
  MINIO_SECRET_KEY: z.string().min(1, { message: 'MINIO_SECRET_KEY must be defined' }),
  MINIO_REGION: z.string().min(1, { message: 'MINIO_REGION must be defined' }),
  MINIO_BUCKET: z.string().min(1, { message: 'MINIO_BUCKET must be defined' }),
  MINIO_PRESIGNED_URL_EXPIRATION_SECONDS: z
    .coerce.number({ invalid_type_error: 'MINIO_PRESIGNED_URL_EXPIRATION_SECONDS must be a valid number' })
    .int()
    .positive({ message: 'MINIO_PRESIGNED_URL_EXPIRATION_SECONDS must be a positive integer' }),
  EMAIL_FROM: z.string().min(1, { message: 'EMAIL_FROM must be defined' }),
  EMAIL_SMTP_HOST: z.string().min(1, { message: 'EMAIL_SMTP_HOST must be defined' }),
  EMAIL_SMTP_PORT: z
    .coerce.number({ invalid_type_error: 'EMAIL_SMTP_PORT must be a valid number' })
    .int()
    .positive({ message: 'EMAIL_SMTP_PORT must be a positive integer' }),
  EMAIL_SMTP_SECURE: z.enum(['true', 'false']).transform((value) => value === 'true'),
  EMAIL_SMTP_USER: z.string().min(1, { message: 'EMAIL_SMTP_USER must be defined' }),
  EMAIL_SMTP_PASS: z.string().min(1, { message: 'EMAIL_SMTP_PASS must be defined' }),
  CLIENT_PORT: z
    .coerce.number({ invalid_type_error: 'CLIENT_PORT must be a valid number' })
    .int()
    .positive({ message: 'CLIENT_PORT must be a positive integer' }),
  CLIENT_ALLOWED_HOSTS: z
    .string()
    .min(1, { message: 'CLIENT_ALLOWED_HOSTS must be defined' })
    .transform(splitCommaSeparated),
  VITE_API_URL: z.string().url({ message: 'VITE_API_URL must be a valid URL' }),
});

const parseEnvironment = () => {
  const envSource = { ...defaults, ...process.env };
  const result = EnvSchema.safeParse(envSource);

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      logger.error(issue.message, { code: 'ENV_VALIDATION_FAILED', detail: issue });
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
