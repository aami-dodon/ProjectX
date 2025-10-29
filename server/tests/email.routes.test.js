const request = require('supertest')

const mockSendMail = jest.fn()

jest.mock('@/integrations/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

jest.mock('@/integrations/mailer', () => ({
  transporter: {
    sendMail: mockSendMail,
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

describe('POST /api/email/test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendMail.mockReset()
  })

  it('sends a test email when provided a recipient', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'mock-message-id' })

    const app = createApp()
    const response = await request(app)
      .post('/api/email/test')
      .send({ to: 'health@example.com' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'sent',
      messageId: 'mock-message-id',
    })
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'health@example.com',
        subject: expect.stringContaining('Project X'),
      })
    )
  })

  it('rejects requests without a recipient email', async () => {
    const app = createApp()
    const response = await request(app).post('/api/email/test').send({})

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: {
        message: 'Recipient email is required',
        code: 'VALIDATION_ERROR',
        details: null,
        requestId: null,
        traceId: null,
      },
    })
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  it('returns an integration error if the mailer fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP offline'))

    const app = createApp()
    const response = await request(app)
      .post('/api/email/test')
      .send({ to: 'health@example.com' })

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      error: {
        message: 'Failed to send test email',
        code: 'INTEGRATION_ERROR',
        details: { cause: 'SMTP offline' },
        requestId: null,
        traceId: null,
      },
    })
  })
})
