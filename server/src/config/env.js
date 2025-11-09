// src/config/env.js
const { config: loadEnvConfig } = require('dotenv');
const { z } = require('zod');
const { createLogger } = require('@/utils/logger');

// ✅ Load .env before anything else
loadEnvConfig();

const DEFAULT_NODE_ENV = 'development';
const resolveDefaultLogLevel = (nodeEnv) =>
  nodeEnv === 'development' ? 'debug' : 'info';

// ✅ Normalize NODE_ENV and LOG_LEVEL
process.env.NODE_ENV = (process.env.NODE_ENV || DEFAULT_NODE_ENV).trim();
process.env.LOG_LEVEL = (process.env.LOG_LEVEL || resolveDefaultLogLevel(process.env.NODE_ENV))
  .trim()
  .toLowerCase();

const logger = createLogger('env');

// ✅ Helper for comma-separated values
const splitCommaSeparated = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const LOG_LEVEL_VALUES = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];

// ✅ Default values (safe for local dev only)
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
  MINIO_PRESIGNED_URL_EXPIRATION_SECONDS: '3600',
  EMAIL_FROM: 'no-reply@projectx.local',
  EMAIL_SMTP_HOST: 'localhost',
  EMAIL_SMTP_PORT: '1025',
  EMAIL_SMTP_SECURE: 'false',
  EMAIL_SMTP_USER: 'smtp-user',
  EMAIL_SMTP_PASS: 'smtp-pass',
  AUTH_ACCESS_TOKEN_SECRET: 'dev-access-token-secret-change-me',
  AUTH_REFRESH_TOKEN_SECRET: 'dev-refresh-token-secret-change-me',
  AUTH_ACCESS_TOKEN_TTL_SECONDS: '900',
  AUTH_REFRESH_TOKEN_TTL_SECONDS: '604800',
  AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES: '30',
  AUTH_EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: '1440',
  AUTH_PASSWORD_SALT_ROUNDS: '12',
  APP_BASE_URL: 'http://localhost:5173',
  CLIENT_PORT: '5173',
  CLIENT_ALLOWED_HOSTS: 'localhost',
  VITE_API_URL: 'http://localhost:5000/api',
  AUTH_RBAC_MODEL_PATH: 'src/modules/auth/casbin/rbac_with_domains_model.conf',
  AUTH_RBAC_POLICY_SEED_PATH: 'src/modules/auth/casbin/policy.seed.json',
  AUTH_RBAC_CACHE_TTL_SECONDS: '300',
  LOG_LEVEL: process.env.LOG_LEVEL,
  PROBE_REGISTRY_WEBHOOK_SECRET: 'dev-probe-webhook',
  PROBE_HEARTBEAT_INTERVAL_SECONDS: '300',
  PROBE_HEARTBEAT_GRACE_SECONDS: '600',
  PROBE_DEPLOYMENT_TOPIC: 'probe.rollouts',
  PROBE_SDK_VERSION_MIN: '1.0.0',
  PROBE_SDK_VERSION_TARGET: '1.2.0',
};

const optionalFromString = (schema) =>
  z.preprocess((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    }

    return value;
  }, schema.optional());

// ✅ Zod validation schema
const EnvSchema = z.object({
  NODE_ENV: z.string().min(1),
  SERVER_PORT: z.coerce.number().int().positive(),
  CORS_ALLOWED_ORIGINS: z.string().min(1).transform(splitCommaSeparated),
  DATABASE_URL: z
    .string()
    .url({ message: 'DATABASE_URL must be a valid URL (e.g. postgresql://user:pass@host:port/db)' }),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_USE_SSL: z.enum(['true', 'false']).transform((v) => v === 'true'),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_REGION: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  MINIO_PRESIGNED_URL_EXPIRATION_SECONDS: z.coerce.number().int().positive(),
  EMAIL_FROM: z.string().min(1),
  EMAIL_SMTP_HOST: z.string().min(1),
  EMAIL_SMTP_PORT: z.coerce.number().int().positive(),
  EMAIL_SMTP_SECURE: z.enum(['true', 'false']).transform((v) => v === 'true'),
  EMAIL_SMTP_USER: z.string().min(1),
  EMAIL_SMTP_PASS: z.string().min(1),
  AUTH_ACCESS_TOKEN_SECRET: z.string().min(32),
  AUTH_REFRESH_TOKEN_SECRET: z.string().min(32),
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive(),
  AUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive(),
  AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive(),
  AUTH_EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: z.coerce.number().int().positive(),
  AUTH_PASSWORD_SALT_ROUNDS: z.coerce.number().int().min(10),
  APP_BASE_URL: z.string().url(),
  CLIENT_PORT: z.coerce.number().int().positive(),
  CLIENT_ALLOWED_HOSTS: z.string().min(1).transform(splitCommaSeparated),
  VITE_API_URL: z.string().url(),
  AUTH_RBAC_MODEL_PATH: z.string().min(1),
  AUTH_RBAC_POLICY_SEED_PATH: z.string().min(1),
  AUTH_RBAC_CACHE_TTL_SECONDS: z.coerce.number().int().positive(),
  PROBE_REGISTRY_WEBHOOK_SECRET: z.string().min(1),
  PROBE_HEARTBEAT_INTERVAL_SECONDS: z.coerce.number().int().positive(),
  PROBE_HEARTBEAT_GRACE_SECONDS: z.coerce.number().int().positive(),
  PROBE_DEPLOYMENT_TOPIC: z.string().min(1),
  PROBE_SDK_VERSION_MIN: z.string().min(1),
  PROBE_SDK_VERSION_TARGET: z.string().min(1),
  LOG_LEVEL: z.enum(LOG_LEVEL_VALUES),
  AUTH_DEFAULT_ADMIN_EMAIL: optionalFromString(z.string().email()),
  AUTH_DEFAULT_ADMIN_PASSWORD: optionalFromString(z.string().min(12)),
  AUTH_DEFAULT_ADMIN_NAME: optionalFromString(z.string().min(1)),
});

// ✅ Validate and export environment
const parseEnvironment = () => {
  const envSource = { ...defaults, ...process.env };
  const result = EnvSchema.safeParse(envSource);

  if (!result.success) {
    // Avoid flooding CI/test logs
    if (process.env.NODE_ENV !== 'test') {
      result.error.issues.forEach((issue) => {
        logger.error(issue.message, { code: 'ENV_VALIDATION_FAILED', detail: issue });
      });
    }

    // Fail fast
    throw new Error('Environment validation failed');
  }

  return result.data;
};

const env = parseEnvironment();

// ✅ Explicitly ensure DATABASE_URL is defined for Prisma
if (!env.DATABASE_URL) {
  logger.error('DATABASE_URL is missing or invalid — Prisma will fail to connect.');
  process.exit(1);
}

module.exports = { env };
