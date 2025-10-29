const request = require('supertest')

const { createIntegrationError, createValidationError } = require('@/utils/errors')

const mockGetHealthStatus = jest.fn()

jest.mock('@/integrations/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

jest.mock('@/modules/health/health.service', () => ({
  getHealthStatus: (...args) => mockGetHealthStatus(...args),
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
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHealthStatus.mockReset()
  })

  it('returns an operational health snapshot', async () => {
    mockGetHealthStatus.mockResolvedValue({
      status: 'operational',
      system: { status: 'operational' },
      api: { status: 'operational', database: { status: 'operational', latencyMs: 12, error: null } },
      cors: { status: 'operational', issues: [] },
    })

    const app = createApp()
    const response = await request(app).get('/api/health')

    expect(mockGetHealthStatus).toHaveBeenCalledWith({
      corsOptions: expect.any(Object),
      serverStartTime: expect.any(Number),
    })
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      status: 'operational',
      requestId: null,
      traceId: null,
      data: {
        system: { status: 'operational' },
        api: {
          status: 'operational',
          database: { status: 'operational', latencyMs: 12, error: null },
        },
        cors: { status: 'operational', issues: [] },
      },
    })
    expect(response.body.timestamp).toEqual(expect.any(String))
  })

  it('returns a validation error when the health payload is invalid', async () => {
    mockGetHealthStatus.mockRejectedValue(
      createValidationError('Health service validation failed', { field: 'payload' }),
    )

    const app = createApp()
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: {
        message: 'Health service validation failed',
        code: 'VALIDATION_ERROR',
        details: { field: 'payload' },
        requestId: null,
        traceId: null,
      },
    })
  })

  it('returns an integration error when the health checks fail', async () => {
    mockGetHealthStatus.mockRejectedValue(
      createIntegrationError('Health checks failed', { cause: 'database timeout' }),
    )

    const app = createApp()
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      error: {
        message: 'Health checks failed',
        code: 'INTEGRATION_ERROR',
        details: { cause: 'database timeout' },
        requestId: null,
        traceId: null,
      },
    })
  })
})
