const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const parseNumber = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const config = {
  server: {
    port: parseNumber(process.env.PORT, 4000),
    url: process.env.SERVER_URL ?? 'http://localhost:4000',
    clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
    apiPrefix: '/api',
  },
  database: {
    url: process.env.DATABASE_URL,
    logLevel: process.env.PRISMA_LOG_LEVEL ?? 'info',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT,
    port: parseNumber(process.env.MINIO_PORT, 9000),
    useSSL: parseBoolean(process.env.MINIO_USE_SSL, true),
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET,
    region: process.env.MINIO_REGION ?? 'us-east-1',
    allowedOrigins: (process.env.MINIO_CORS_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    presignExpiration: parseNumber(process.env.MINIO_PRESIGNED_URL_EXPIRATION_SECONDS, 3600),
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseNumber(process.env.SMTP_PORT, 587),
    secure: parseBoolean(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? 'Project X <no-reply@example.com>',
  },
  client: {
    appName: process.env.VITE_APP_NAME ?? 'Project X',
  },
};

module.exports = config;
