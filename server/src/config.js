const path = require('path');
const dotenv = require('dotenv');

const repoRoot = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(repoRoot, '.env') });

const toTrimmedString = (value) => {
  if (value === undefined || value === null) return undefined;
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : undefined;
};

const requireEnv = (key, { allowEmpty = false } = {}) => {
  const value = toTrimmedString(process.env[key]);
  if (value === undefined && !allowEmpty) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  if (!allowEmpty && value !== undefined && value.length === 0) {
    throw new Error(`Environment variable ${key} must not be empty`);
  }
  return value;
};

const parseNumberEnv = (key, { optional = false } = {}) => {
  const raw = optional ? toTrimmedString(process.env[key]) : requireEnv(key);
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number, received "${raw}"`);
  }
  return parsed;
};

const parseBooleanEnv = (key, { optional = false } = {}) => {
  const raw = optional ? toTrimmedString(process.env[key]) : requireEnv(key);
  if (raw === undefined) return undefined;
  const normalized = raw.toLowerCase();
  if (!['true', 'false', '1', '0', 'yes', 'no'].includes(normalized)) {
    throw new Error(`Environment variable ${key} must be a boolean string, received "${raw}"`);
  }
  return ['true', '1', 'yes'].includes(normalized);
};

const parseListEnv = (key, { optional = false } = {}) => {
  const raw = optional ? toTrimmedString(process.env[key]) : requireEnv(key);
  if (raw === undefined) return [];
  const items = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!items.length && !optional) {
    throw new Error(`Environment variable ${key} must contain at least one value`);
  }
  return items;
};

const pickEnvKey = (...keys) => {
  for (const key of keys) {
    if (toTrimmedString(process.env[key]) !== undefined) {
      return key;
    }
  }
  return undefined;
};

const requiredServerPort = parseNumberEnv('SERVER_PORT');
const requiredApiPrefix = requireEnv('API_PREFIX');
const normalizedApiPrefix = requiredApiPrefix.startsWith('/')
  ? requiredApiPrefix
  : `/${requiredApiPrefix}`;
const corsAllowedOrigins = parseListEnv('CORS_ALLOWED_ORIGINS');
const databaseUrl = requireEnv('DATABASE_URL');
const minioPort = parseNumberEnv('MINIO_PORT');
const minioUseSSL = parseBooleanEnv('MINIO_USE_SSL');
const minioPresignExpiration = parseNumberEnv('MINIO_PRESIGNED_URL_EXPIRATION_SECONDS');
const smtpPortKey = pickEnvKey('SMTP_PORT', 'EMAIL_SMTP_PORT');
const smtpSecureKey = pickEnvKey('SMTP_SECURE', 'EMAIL_SMTP_SECURE');
const smtpHostKey = pickEnvKey('SMTP_HOST', 'EMAIL_SMTP_HOST');
const smtpUserKey = pickEnvKey('SMTP_USER', 'EMAIL_SMTP_USER');
const smtpPassKey = pickEnvKey('SMTP_PASS', 'EMAIL_SMTP_PASS');
const smtpFromKey = pickEnvKey('SMTP_FROM', 'EMAIL_FROM');

if (!smtpPortKey || !smtpSecureKey || !smtpHostKey || !smtpUserKey || !smtpPassKey || !smtpFromKey) {
  throw new Error(
    'Missing required SMTP environment variables. Provide SMTP_* or EMAIL_SMTP_* variants.'
  );
}

const smtpPort = parseNumberEnv(smtpPortKey);
const smtpSecure = parseBooleanEnv(smtpSecureKey);

const config = {
  server: {
    port: requiredServerPort,
    url: toTrimmedString(process.env.SERVER_URL),
    clientUrl: toTrimmedString(process.env.CLIENT_URL),
    allowedOrigins: corsAllowedOrigins,
    apiPrefix: normalizedApiPrefix,
  },
  database: {
    url: databaseUrl,
    logLevel: toTrimmedString(process.env.PRISMA_LOG_LEVEL) ?? 'info',
  },
  minio: {
    endpoint: requireEnv('MINIO_ENDPOINT'),
    port: minioPort,
    useSSL: minioUseSSL,
    accessKey: requireEnv('MINIO_ACCESS_KEY'),
    secretKey: requireEnv('MINIO_SECRET_KEY'),
    bucket: requireEnv('MINIO_BUCKET'),
    region: requireEnv('MINIO_REGION'),
    allowedOrigins: parseListEnv('MINIO_CORS_ALLOWED_ORIGINS', { optional: true }),
    presignExpiration: minioPresignExpiration,
  },
  smtp: {
    host: requireEnv(smtpHostKey),
    port: smtpPort,
    secure: smtpSecure,
    user: requireEnv(smtpUserKey),
    pass: requireEnv(smtpPassKey),
    from: requireEnv(smtpFromKey),
  },
  client: {
    appName: toTrimmedString(process.env.VITE_APP_NAME),
  },
};

module.exports = config;
