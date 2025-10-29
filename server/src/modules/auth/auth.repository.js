const { prisma } = require('@/integrations/prisma');

const USER_INCLUDE = {
  roleAssignments: {
    include: {
      role: true,
    },
  },
};

const findUserByEmail = (email) =>
  prisma.authUser.findUnique({
    where: { email },
    include: USER_INCLUDE,
  });

const findUserById = (id) =>
  prisma.authUser.findUnique({
    where: { id },
    include: USER_INCLUDE,
  });

const createUser = ({ email, passwordHash, fullName, status }) =>
  prisma.authUser.create({
    data: {
      email,
      passwordHash,
      fullName,
      status,
    },
    include: USER_INCLUDE,
  });

const updateUser = (id, data) =>
  prisma.authUser.update({
    where: { id },
    data,
    include: USER_INCLUDE,
  });

const upsertRole = ({ name, description, isSystemDefault = false }) =>
  prisma.authRole.upsert({
    where: { name },
    update: {
      description,
      isSystemDefault,
    },
    create: {
      name,
      description,
      isSystemDefault,
    },
  });

const assignRoleToUser = ({ userId, roleId, assignedBy, expiresAt }) =>
  prisma.authRoleAssignment.create({
    data: {
      userId,
      roleId,
      assignedBy,
      expiresAt,
    },
    include: {
      role: true,
      user: {
        include: USER_INCLUDE,
      },
    },
  });

const listUserSessions = (userId) =>
  prisma.authSession.findMany({
    where: { userId, revokedAt: null },
  });

const createSession = ({ userId, refreshTokenHash, userAgent, ipAddress, expiresAt }) =>
  prisma.authSession.create({
    data: {
      userId,
      refreshTokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

const findSessionByTokenHash = (refreshTokenHash) =>
  prisma.authSession.findFirst({
    where: {
      refreshTokenHash,
      revokedAt: null,
    },
    include: {
      user: {
        include: USER_INCLUDE,
      },
    },
  });

const revokeSessionById = (id) =>
  prisma.authSession.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

const revokeAllSessionsForUser = (userId) =>
  prisma.authSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

const createPasswordReset = ({ userId, tokenHash, expiresAt }) =>
  prisma.authPasswordReset.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

const findPasswordResetByHash = (tokenHash) =>
  prisma.authPasswordReset.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

const consumePasswordReset = (id) =>
  prisma.authPasswordReset.update({
    where: { id },
    data: { consumedAt: new Date() },
  });

const createEmailVerification = ({ userId, tokenHash, expiresAt }) =>
  prisma.authEmailVerification.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

const findEmailVerificationByHash = (tokenHash) =>
  prisma.authEmailVerification.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

const consumeEmailVerification = (id) =>
  prisma.authEmailVerification.update({
    where: { id },
    data: { consumedAt: new Date() },
  });

const logAuthEvent = ({ userId, eventType, payload }) =>
  prisma.authEventLedger.create({
    data: {
      userId,
      eventType,
      payload,
    },
  });

module.exports = {
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
  listUserSessions,
  logAuthEvent,
  revokeAllSessionsForUser,
  revokeSessionById,
  updateUser,
  upsertRole,
};
