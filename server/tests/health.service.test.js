process.env.NODE_ENV = 'test';
process.env.SERVER_PORT = '4000';
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
process.env.BUILD_TIMESTAMP = '2024-05-01T12:00:00Z';

jest.mock('../src/integrations/prisma', () => ({
  prisma: {
    $connect: jest.fn(() => Promise.resolve()),
    $queryRaw: jest.fn(() => Promise.resolve([{ result: 1 }])),
  },
}));

jest.mock('../src/integrations/minio', () => ({
  minioClient: {
    listBuckets: jest.fn(() => Promise.resolve([])),
    bucketExists: jest.fn(() => Promise.resolve(true)),
    getBucketPolicy: jest.fn(() => Promise.resolve('http://localhost:5173')),
  },
}));

jest.mock('../src/integrations/mailer', () => ({
  verifyTransporter: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('dns', () => ({
  promises: {
    lookup: jest.fn(() => Promise.resolve({ address: '127.0.0.1', family: 4 })),
  },
}));

jest.mock('fs/promises', () => ({
  statfs: jest.fn(() =>
    Promise.resolve({
      bsize: 4096,
      blocks: 100000,
      bavail: 50000,
    }),
  ),
}));

jest.mock('os', () => ({
  loadavg: () => [1.25, 0.75, 0.25],
  cpus: () => new Array(4).fill({}),
  totalmem: () => 16 * 1024 * 1024 * 1024,
  freemem: () => 8 * 1024 * 1024 * 1024,
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
    expect(payload.api.status).toBe('ok');
    expect(payload.database.status).toBe('ok');
    expect(payload.database.connection.status).toBe('ok');
    expect(payload.database.query.status).toBe('ok');
    expect(payload.minio.status).toBe('ok');
    expect(payload.minio.connection.status).toBe('ok');
    expect(payload.minio.bucketCheck.status).toBe('ok');
    expect(payload.minio.cors.status).toBe('ok');
    expect(payload.email.status).toBe('ok');
    expect(payload.dns.status).toBe('ok');
    expect(payload.cors.status).toBe('ok');
    expect(payload.system.status).toBe('ok');
    expect(payload.environment.name).toBe('test');
    expect(payload.environment.buildTimestamp).toBe('2024-05-01T12:00:00Z');
    expect(payload.latencyMs).toBeGreaterThanOrEqual(0);
    expect(payload.uptime.seconds).toBeGreaterThanOrEqual(5);
  });
});
