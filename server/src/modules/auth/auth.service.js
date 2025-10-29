const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');
const {
  assignRoleToUser,
  consumeEmailVerification,
  consumePasswordReset,
  createEmailVerification,
  createPasswordReset,
  createSession,
  createUser,
  findEmailVerificationByHash,
  findPasswordResetByHash,
  findSessionByTokenHash,
  findUserByEmail,
  findUserById,
  logAuthEvent,
  revokeAllSessionsForUser,
  revokeSessionById,
  updateUser,
  upsertRole,
} = require('./auth.repository');
const { sendMail } = require('@/integrations/mailer');
const { renderVerificationEmail } = require('./emails/verification-email');
const { renderPasswordResetEmail } = require('./emails/password-reset-email');
const {
  createValidationError,
  createUnauthorizedError,
  createNotFoundError,
} = require('@/utils/error-handling');

const logger = createLogger('auth-service');

const DEFAULT_ROLE_NAME = 'operator';
const DEFAULT_ROLE_DESCRIPTION = 'Standard operator with baseline governance permissions.';

const hashValue = (value) =>
  crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');

const sanitizeUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    tenantId: user.tenantId,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    mfaEnabled: user.mfaEnabled,
    roles: (user.roleAssignments ?? []).map((assignment) => ({
      id: assignment.role.id,
      name: assignment.role.name,
      description: assignment.role.description,
    })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const issueAccessToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    roles: (user.roleAssignments ?? []).map((assignment) => assignment.role.name),
    jti: uuidv4(),
  };

  return jwt.sign(payload, env.AUTH_ACCESS_TOKEN_SECRET, {
    expiresIn: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
  });
};

const issueRefreshToken = () => {
  const token = crypto.randomBytes(48).toString('hex');
  return token;
};

const ensureDefaultRole = async () => {
  const role = await upsertRole({
    name: DEFAULT_ROLE_NAME,
    description: DEFAULT_ROLE_DESCRIPTION,
    isSystemDefault: true,
  });

  return role;
};

const registerUser = async ({ email, password, fullName, tenantId }) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail) {
    throw createValidationError('Email is required for registration');
  }

  if (typeof password !== 'string' || password.length < 12) {
    throw createValidationError('Password must contain at least 12 characters');
  }

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw createValidationError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, env.AUTH_PASSWORD_SALT_ROUNDS);
  const user = await createUser({
    email: normalizedEmail,
    passwordHash,
    fullName,
    tenantId,
    status: 'PENDING_VERIFICATION',
  });

  const defaultRole = await ensureDefaultRole();
  await assignRoleToUser({
    userId: user.id,
    roleId: defaultRole.id,
  });

  const enrichedUser = await findUserById(user.id);

  const verificationToken = issueRefreshToken();
  const verificationHash = hashValue(verificationToken);
  const expiresAt = new Date(Date.now() + env.AUTH_EMAIL_VERIFICATION_TOKEN_TTL_MINUTES * 60 * 1000);

  await createEmailVerification({
    userId: user.id,
    tokenHash: verificationHash,
    expiresAt,
  });

  const verificationEmail = renderVerificationEmail({
    recipient: normalizedEmail,
    fullName,
    token: verificationToken,
    appBaseUrl: env.APP_BASE_URL,
  });

  await sendMail(verificationEmail);
  await logAuthEvent({
    userId: user.id,
    eventType: 'auth.user.registered',
    payload: {
      email: normalizedEmail,
      tenantId,
    },
  });

  logger.info('User registered', { userId: user.id, email: normalizedEmail });
  return sanitizeUser(enrichedUser ?? user);
};

const loginUser = async ({ email, password, metadata = {} }) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || typeof password !== 'string') {
    throw createValidationError('Email and password are required');
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    throw createUnauthorizedError('Invalid email or password');
  }

  if (user.status === 'SUSPENDED') {
    throw createUnauthorizedError('Account has been suspended');
  }

  if (!user.emailVerifiedAt) {
    throw createUnauthorizedError('Email verification is required before logging in');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw createUnauthorizedError('Invalid email or password');
  }

  const accessToken = issueAccessToken(user);
  const refreshToken = issueRefreshToken();
  const refreshTokenHash = hashValue(refreshToken);
  const refreshExpiresAt = new Date(Date.now() + env.AUTH_REFRESH_TOKEN_TTL_SECONDS * 1000);

  await createSession({
    userId: user.id,
    refreshTokenHash,
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
    expiresAt: refreshExpiresAt,
  });

  await updateUser(user.id, {
    lastLoginAt: new Date(),
    status: user.status === 'INVITED' ? 'ACTIVE' : user.status,
  });

  await logAuthEvent({
    userId: user.id,
    eventType: 'auth.session.created',
    payload: {
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    },
  });

  logger.info('User logged in', { userId: user.id });

  return {
    accessToken,
    refreshToken,
    expiresIn: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    refreshExpiresAt,
    user: sanitizeUser({ ...user }),
  };
};

const logoutUser = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw createValidationError('Refresh token is required for logout');
  }

  const refreshTokenHash = hashValue(refreshToken);
  const session = await findSessionByTokenHash(refreshTokenHash);
  if (!session) {
    throw createNotFoundError('Active session not found for provided token');
  }

  await revokeSessionById(session.id);
  await logAuthEvent({
    userId: session.userId,
    eventType: 'auth.session.revoked',
    payload: {
      reason: 'logout',
    },
  });

  logger.info('Session revoked', { sessionId: session.id });
  return { status: 'revoked' };
};

const refreshSession = async ({ refreshToken, metadata = {} }) => {
  if (!refreshToken) {
    throw createValidationError('Refresh token is required');
  }

  const refreshTokenHash = hashValue(refreshToken);
  const session = await findSessionByTokenHash(refreshTokenHash);

  if (!session) {
    throw createUnauthorizedError('Refresh token is invalid or has been revoked');
  }

  if (session.expiresAt <= new Date()) {
    await revokeSessionById(session.id);
    throw createUnauthorizedError('Refresh token has expired');
  }

  const user = await findUserById(session.userId);
  if (!user) {
    await revokeSessionById(session.id);
    throw createUnauthorizedError('Associated account no longer exists');
  }

  const accessToken = issueAccessToken(user);
  const rotatedRefreshToken = issueRefreshToken();
  const rotatedHash = hashValue(rotatedRefreshToken);
  const refreshExpiresAt = new Date(Date.now() + env.AUTH_REFRESH_TOKEN_TTL_SECONDS * 1000);

  await updateUser(user.id, { lastLoginAt: new Date() });
  await logAuthEvent({
    userId: user.id,
    eventType: 'auth.session.refreshed',
    payload: {
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    },
  });

  await revokeSessionById(session.id);
  await createSession({
    userId: user.id,
    refreshTokenHash: rotatedHash,
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
    expiresAt: refreshExpiresAt,
  });

  return {
    accessToken,
    refreshToken: rotatedRefreshToken,
    expiresIn: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    refreshExpiresAt,
    user: sanitizeUser(user),
  };
};

const requestPasswordReset = async ({ email }) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail) {
    throw createValidationError('Email is required');
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return { status: 'queued' };
  }

  const token = issueRefreshToken();
  const tokenHash = hashValue(token);
  const expiresAt = new Date(Date.now() + env.AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await createPasswordReset({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetEmail = renderPasswordResetEmail({
    recipient: normalizedEmail,
    fullName: user.fullName,
    token,
    appBaseUrl: env.APP_BASE_URL,
  });

  await sendMail(resetEmail);
  await logAuthEvent({
    userId: user.id,
    eventType: 'auth.password.reset_requested',
    payload: {},
  });

  logger.info('Password reset requested', { userId: user.id });
  return { status: 'queued' };
};

const resetPassword = async ({ token, password }) => {
  if (!token) {
    throw createValidationError('Reset token is required');
  }

  if (typeof password !== 'string' || password.length < 12) {
    throw createValidationError('Password must contain at least 12 characters');
  }

  const tokenHash = hashValue(token);
  const resetRecord = await findPasswordResetByHash(tokenHash);
  if (!resetRecord) {
    throw createUnauthorizedError('Reset token is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(password, env.AUTH_PASSWORD_SALT_ROUNDS);

  await updateUser(resetRecord.userId, {
    passwordHash,
    status: 'ACTIVE',
  });

  await consumePasswordReset(resetRecord.id);
  await revokeAllSessionsForUser(resetRecord.userId);

  await logAuthEvent({
    userId: resetRecord.userId,
    eventType: 'auth.password.reset_completed',
    payload: {},
  });

  logger.info('Password reset completed', { userId: resetRecord.userId });
  return { status: 'updated' };
};

const verifyEmail = async ({ token }) => {
  if (!token) {
    throw createValidationError('Verification token is required');
  }

  const tokenHash = hashValue(token);
  const record = await findEmailVerificationByHash(tokenHash);
  if (!record) {
    throw createUnauthorizedError('Verification token is invalid or expired');
  }

  const user = await updateUser(record.userId, {
    emailVerifiedAt: new Date(),
    status: 'ACTIVE',
  });

  await consumeEmailVerification(record.id);
  await logAuthEvent({
    userId: record.userId,
    eventType: 'auth.user.verified',
    payload: {},
  });

  logger.info('User email verified', { userId: record.userId });
  return sanitizeUser(user);
};

module.exports = {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
};
