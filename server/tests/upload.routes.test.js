const request = require('supertest')

const mockPresignedPutObject = jest.fn()
const mockPresignedGetObject = jest.fn()

jest.mock('@/integrations/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

jest.mock('@/integrations/minio', () => ({
  minioClient: {
    presignedPutObject: mockPresignedPutObject,
    presignedGetObject: mockPresignedGetObject,
  },
}))

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

const { createApp } = require('../src/app')

describe('POST /api/upload/test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPresignedPutObject.mockReset()
    mockPresignedGetObject.mockReset()
  })

  it('returns presigned URLs for valid upload requests', async () => {
    mockPresignedPutObject.mockResolvedValue('https://minio.example.com/upload')
    mockPresignedGetObject.mockResolvedValue('https://minio.example.com/download')

    const app = createApp()
    const response = await request(app)
      .post('/api/upload/test')
      .send({ contentType: 'image/png', prefix: 'diagnostics' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      bucket: 'evidence',
      objectName: expect.stringMatching(/^diagnostics\//),
      uploadUrl: 'https://minio.example.com/upload',
      downloadUrl: 'https://minio.example.com/download',
      expiresIn: expect.any(Number),
      headers: {
        'Content-Type': 'image/png',
      },
    })
    expect(mockPresignedPutObject).toHaveBeenCalled()
    expect(mockPresignedGetObject).toHaveBeenCalled()
  })

  it('rejects requests without a content type', async () => {
    const app = createApp()
    const response = await request(app).post('/api/upload/test').send({})

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: {
        message: 'Content type is required',
        code: 'VALIDATION_ERROR',
        details: null,
        requestId: null,
        traceId: null,
      },
    })
    expect(mockPresignedPutObject).not.toHaveBeenCalled()
    expect(mockPresignedGetObject).not.toHaveBeenCalled()
  })

  it('surfaces integration failures from MinIO', async () => {
    mockPresignedPutObject.mockRejectedValue(new Error('MinIO unavailable'))

    const app = createApp()
    const response = await request(app)
      .post('/api/upload/test')
      .send({ contentType: 'image/png' })

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      error: {
        message: 'Failed to create presigned upload URL',
        code: 'INTEGRATION_ERROR',
        details: { cause: 'MinIO unavailable' },
        requestId: null,
        traceId: null,
      },
    })
  })
})
