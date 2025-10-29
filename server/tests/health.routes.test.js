const request = require('supertest')

jest.mock('@/integrations/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

const { createApp } = require('../src/app')

jest.mock('@/utils/logger', () => {
  const actual = jest.requireActual('@/utils/logger')
  const createMockLogger = () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  })

  return {
    ...actual,
    createLogger: jest.fn(() => createMockLogger()),
  }
})

describe('GET /api/health', () => {
  it('returns an operational health snapshot', async () => {
    const app = createApp()
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('status', 'operational')
    expect(response.body).toHaveProperty('data')
    expect(response.body.data).toHaveProperty('system')
    expect(response.body.data).toHaveProperty('api')
    expect(response.body.data).toHaveProperty('cors')
  })
})
