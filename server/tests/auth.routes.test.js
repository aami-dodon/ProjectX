const request = require('supertest')

const {
  createNotFoundError,
  createUnauthorizedError,
  createValidationError,
} = require('@/utils/error-handling')

const mockRegisterUser = jest.fn()
const mockLoginUser = jest.fn()
const mockLogoutUser = jest.fn()
const mockRefreshSession = jest.fn()
const mockRequestPasswordReset = jest.fn()
const mockResetPassword = jest.fn()
const mockVerifyEmail = jest.fn()

jest.mock('@/integrations/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

jest.mock('@/modules/auth/auth.service', () => ({
  registerUser: (...args) => mockRegisterUser(...args),
  loginUser: (...args) => mockLoginUser(...args),
  logoutUser: (...args) => mockLogoutUser(...args),
  refreshSession: (...args) => mockRefreshSession(...args),
  requestPasswordReset: (...args) => mockRequestPasswordReset(...args),
  resetPassword: (...args) => mockResetPassword(...args),
  verifyEmail: (...args) => mockVerifyEmail(...args),
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

describe('Auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRegisterUser.mockReset()
    mockLoginUser.mockReset()
    mockLogoutUser.mockReset()
    mockRefreshSession.mockReset()
    mockRequestPasswordReset.mockReset()
    mockResetPassword.mockReset()
    mockVerifyEmail.mockReset()
  })

  describe('POST /api/auth/register', () => {
    it('returns the registered user profile', async () => {
      mockRegisterUser.mockResolvedValue({
        id: 'user-123',
        email: 'new@example.com',
        roles: [],
      })

      const app = createApp()
      const response = await request(app).post('/api/auth/register').send({
        email: 'new@example.com',
        password: 'very-secure-password',
      })

      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        user: { id: 'user-123', email: 'new@example.com', roles: [] },
      })
      expect(mockRegisterUser).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'very-secure-password',
      })
    })

    it('propagates validation errors from the service', async () => {
      mockRegisterUser.mockRejectedValue(
        createValidationError('Email is required for registration')
      )

      const app = createApp()
      const response = await request(app).post('/api/auth/register').send({})

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: {
          message: 'Email is required for registration',
          code: 'VALIDATION_ERROR',
          details: null,
          requestId: null,
          traceId: null,
        },
      })
    })
  })

  describe('POST /api/auth/login', () => {
    it('returns session tokens and metadata on success', async () => {
      const loginResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        refreshExpiresAt: '2099-01-01T00:00:00.000Z',
        user: { id: 'user-1', email: 'user@example.com' },
      }
      mockLoginUser.mockResolvedValue(loginResponse)

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Supertest')
        .send({ email: 'user@example.com', password: 'password-123' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(loginResponse)
      expect(mockLoginUser).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password-123',
        metadata: {
          userAgent: 'Supertest',
          ipAddress: expect.any(String),
        },
      })
    })

    it('maps unauthorized errors to 401 responses', async () => {
      mockLoginUser.mockRejectedValue(
        createUnauthorizedError('Invalid email or password')
      )

      const app = createApp()
      const response = await request(app).post('/api/auth/login').send({
        email: 'user@example.com',
        password: 'wrong-password',
      })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        error: {
          message: 'Invalid email or password',
          code: 'UNAUTHORIZED',
          details: null,
          requestId: null,
          traceId: null,
        },
      })
    })
  })

  describe('POST /api/auth/logout', () => {
    it('revokes the current session using the provided refresh token', async () => {
      mockLogoutUser.mockResolvedValue({ status: 'revoked' })

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'refresh-token' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ status: 'revoked' })
      expect(mockLogoutUser).toHaveBeenCalledWith({
        refreshToken: 'refresh-token',
      })
    })

    it('propagates not found errors for missing sessions', async () => {
      mockLogoutUser.mockRejectedValue(
        createNotFoundError('Active session not found for provided token')
      )

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'invalid-token' })

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        error: {
          message: 'Active session not found for provided token',
          code: 'NOT_FOUND',
          details: null,
          requestId: null,
          traceId: null,
        },
      })
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('rotates the refresh token and returns a new access token', async () => {
      const refreshResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'rotated-refresh-token',
        expiresIn: 900,
        refreshExpiresAt: '2099-01-02T00:00:00.000Z',
        user: { id: 'user-1', email: 'user@example.com' },
      }
      mockRefreshSession.mockResolvedValue(refreshResponse)

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('User-Agent', 'Supertest')
        .send({ refreshToken: 'refresh-token' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(refreshResponse)
      expect(mockRefreshSession).toHaveBeenCalledWith({
        refreshToken: 'refresh-token',
        metadata: {
          userAgent: 'Supertest',
          ipAddress: expect.any(String),
        },
      })
    })

    it('maps unauthorized errors to 401 responses', async () => {
      mockRefreshSession.mockRejectedValue(
        createUnauthorizedError('Refresh token is invalid or has been revoked')
      )

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'bad-token' })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        error: {
          message: 'Refresh token is invalid or has been revoked',
          code: 'UNAUTHORIZED',
          details: null,
          requestId: null,
          traceId: null,
        },
      })
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    it('queues a password reset request', async () => {
      mockRequestPasswordReset.mockResolvedValue({ status: 'queued' })

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@example.com' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ status: 'queued' })
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({
        email: 'user@example.com',
      })
    })

    it('validates incoming payloads', async () => {
      mockRequestPasswordReset.mockRejectedValue(
        createValidationError('Email is required')
      )

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: {
          message: 'Email is required',
          code: 'VALIDATION_ERROR',
          details: null,
          requestId: null,
          traceId: null,
        },
      })
    })
  })

  describe('POST /api/auth/reset-password', () => {
    it('updates the user password for a valid reset token', async () => {
      mockResetPassword.mockResolvedValue({ status: 'updated' })

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'reset-token', password: 'new-secure-password' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ status: 'updated' })
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: 'reset-token',
        password: 'new-secure-password',
      })
    })

    it('validates reset requests before delegating to the service', async () => {
      mockResetPassword.mockRejectedValue(
        createValidationError('Reset token is required')
      )

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error: {
          message: 'Reset token is required',
          code: 'VALIDATION_ERROR',
          details: null,
          requestId: null,
          traceId: null,
        },
      })
    })
  })

  describe('POST /api/auth/verify-email', () => {
    it('returns the verified user profile', async () => {
      mockVerifyEmail.mockResolvedValue({
        id: 'user-123',
        email: 'verified@example.com',
      })

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'verification-token' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        user: { id: 'user-123', email: 'verified@example.com' },
      })
      expect(mockVerifyEmail).toHaveBeenCalledWith({
        token: 'verification-token',
      })
    })

    it('handles invalid verification attempts', async () => {
      mockVerifyEmail.mockRejectedValue(
        createUnauthorizedError('Verification token is invalid or expired')
      )

      const app = createApp()
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'bad-token' })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        error: {
          message: 'Verification token is invalid or expired',
          code: 'UNAUTHORIZED',
          details: null,
          requestId: null,
          traceId: null,
        },
      })
    })
  })
})
