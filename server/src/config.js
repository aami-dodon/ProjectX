const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
};

const parseString = (value, defaultValue = undefined) => {
  if (value === undefined) return defaultValue;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : defaultValue;
};

const parseNumber = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const parseList = (value, defaultValue = []) => {
  const source = parseString(value);
  if (!source) return Array.isArray(defaultValue) ? defaultValue : [defaultValue].filter(Boolean);
  return source
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const pickEnv = (...keys) => {
  for (const key of keys) {
    if (process.env[key] !== undefined) {
      return process.env[key];
    }
  }
  return undefined;
};

const resolveClientUrl = () => {
  const explicit = parseString(process.env.CLIENT_URL);
  if (explicit) return explicit;
  const port = parseNumber(process.env.CLIENT_PORT);
  if (port) {
    return `http://localhost:${port}`;
  }
  return 'http://localhost:5173';
};

const config = {
  server: {
    port: parseNumber(process.env.SERVER_PORT ?? process.env.PORT, 4000),
    url: process.env.SERVER_URL ?? 'http://localhost:4000',
    clientUrl: resolveClientUrl(),
    allowedOrigins: parseList(process.env.CORS_ALLOWED_ORIGINS, resolveClientUrl()),
    apiPrefix: '/api',
  },
  database: {
    url: process.env.DATABASE_URL,
    logLevel: process.env.PRISMA_LOG_LEVEL ?? 'info',
  },
  minio: {
    endpoint: parseString(process.env.MINIO_ENDPOINT),
    port: parseNumber(process.env.MINIO_PORT, 9000),
    useSSL: parseBoolean(process.env.MINIO_USE_SSL, true),
    accessKey: parseString(process.env.MINIO_ACCESS_KEY),
    secretKey: parseString(process.env.MINIO_SECRET_KEY),
    bucket: parseString(process.env.MINIO_BUCKET),
    region: parseString(process.env.MINIO_REGION, 'us-east-1'),
    allowedOrigins: (parseString(process.env.MINIO_CORS_ALLOWED_ORIGINS, '') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    presignExpiration: parseNumber(process.env.MINIO_PRESIGNED_URL_EXPIRATION_SECONDS, 3600),
  },
  smtp: {
    host: parseString(pickEnv('SMTP_HOST', 'EMAIL_SMTP_HOST')),
    port: parseNumber(pickEnv('SMTP_PORT', 'EMAIL_SMTP_PORT'), 587),
    secure: parseBoolean(pickEnv('SMTP_SECURE', 'EMAIL_SMTP_SECURE'), false),
    user: parseString(pickEnv('SMTP_USER', 'EMAIL_SMTP_USER')),
    pass: parseString(pickEnv('SMTP_PASS', 'EMAIL_SMTP_PASS')),
    from: parseString(pickEnv('SMTP_FROM', 'EMAIL_FROM'), 'Project X <no-reply@example.com>'),
  },
  client: {
    appName: process.env.VITE_APP_NAME ?? 'Project X',
  },
};

module.exports = config;
