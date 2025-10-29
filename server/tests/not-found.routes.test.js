const request = require('supertest')

jest.mock('@/integrations/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

const { createApp } = require('../src/app')

describe('Fallback route', () => {
  it('returns a 404 payload for unknown paths', async () => {
    const app = createApp()
    const response = await request(app).get('/api/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: {
        message: 'Route not found',
        code: 'NOT_FOUND',
        details: null,
        requestId: null,
        traceId: null,
      },
    })
  })
})
