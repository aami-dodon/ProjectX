const request = require('supertest');

const { createApp } = require('@/app');

describe('health router', () => {
  const app = createApp();

  it('exposes the root diagnostics endpoint', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('data');
  });

  it('does not expose legacy upload and email health endpoints', async () => {
    const uploadResponse = await request(app).post('/api/health/storage/presign');
    expect(uploadResponse.status).toBe(404);

    const emailResponse = await request(app).post('/api/health/email/test');
    expect(emailResponse.status).toBe(404);
  });
});
