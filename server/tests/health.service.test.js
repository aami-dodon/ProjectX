process.env.NODE_ENV = 'test';
process.env.SERVER_PORT = '4000';
process.env.API_PREFIX = '/api';
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_USE_SSL = 'false';
process.env.MINIO_ACCESS_KEY = 'key';
process.env.MINIO_SECRET_KEY = 'secret';
process.env.MINIO_REGION = 'us-east-1';
process.env.MINIO_BUCKET = 'bucket';
process.env.MINIO_PRESIGNED_URL_EXPIRATION_SECONDS = '3600';
process.env.EMAIL_SMTP_HOST = 'smtp.test';
process.env.EMAIL_SMTP_PORT = '587';
process.env.EMAIL_SMTP_SECURE = 'false';
process.env.EMAIL_SMTP_USER = 'user';
process.env.EMAIL_SMTP_PASS = 'password';
process.env.EMAIL_FROM = 'no-reply@test.dev';
process.env.CLIENT_PORT = '5173';
process.env.CLIENT_ALLOWED_HOSTS = 'localhost';
process.env.VITE_API_URL = 'http://localhost:4000/api';

jest.mock('../src/integrations/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(() => Promise.resolve([{ now: new Date('2024-01-01T00:00:00Z') }])),
  },
}));

jest.mock('../src/integrations/minio', () => ({
  minioClient: {
    bucketExists: jest.fn(() => Promise.resolve(true)),
    getBucketPolicy: jest.fn(() => Promise.resolve('http://localhost:5173')),
  },
}));

const { buildHealthResponse } = require('../src/modules/health/health.service');

const fakeApp = {
  locals: {
    serverStartTime: Date.now() - 5000,
  },
};

describe('buildHealthResponse', () => {
  it('returns health payload with ok statuses when dependencies are reachable', async () => {
    const payload = await buildHealthResponse(fakeApp);

    expect(payload.status).toBe('ok');
    expect(payload.database.status).toBe('ok');
    expect(payload.database.timestamp).toBe('2024-01-01T00:00:00.000Z');
    expect(payload.minio.status).toBe('ok');
    expect(payload.minio.cors.ok).toBe(true);
    expect(payload.uptime.seconds).toBeGreaterThanOrEqual(5);
  });
});
