const {
  createNotFoundError,
  createValidationError,
} = require('@/utils/errors');
const { z } = require('zod');
const { createLogger } = require('@/utils/logger');
const { getFileAccessLink } = require('@/modules/files/file.service');
const { logAuthEvent } = require('@/modules/auth/auth.repository');
const {
  listUsers,
  updateUserById,
  findUserById,
  listRoles,
  findRolesByIds,
} = require('./admin.repository');

const logger = createLogger('admin-service');

const VALID_STATUSES = new Set([
  'PENDING_VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
  'INVITED',
]);

const normalizeStatus = (status) => {
  if (!status || typeof status !== 'string') {
    return null;
  }

  const normalized = status.trim().toUpperCase();
  return VALID_STATUSES.has(normalized) ? normalized : null;
};

const resolveAvatarUrl = async (user) => {
  if (!user || !user.avatarObjectName) {
    return null;
  }

  try {
    const { url } = await getFileAccessLink(user.avatarObjectName, user.id);
    return url;
  } catch (error) {
    logger.warn('Failed to resolve avatar URL for admin listing', {
      userId: user?.id,
      error: error.message,
    });
    return null;
  }
};

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  avatarObjectName: user.avatarObjectName ?? null,
  avatarUrl: user.avatarUrl ?? null,
  status: user.status,
  emailVerifiedAt: user.emailVerifiedAt,
  lastLoginAt: user.lastLoginAt,
  mfaEnabled: user.mfaEnabled,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  roles: (user.roleAssignments ?? []).map((assignment) => ({
    id: assignment.role.id,
    name: assignment.role.name,
    description: assignment.role.description,
  })),
});

const serializeRole = (role) => ({
  id: role.id,
  name: role.name,
  description: role.description ?? null,
  isSystemDefault: role.isSystemDefault,
});

const buildWhereClause = ({ search, status }) => {
  const where = {};

  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus) {
    where.status = normalizedStatus;
  } else if (status) {
    throw createValidationError('Invalid status filter provided', {
      field: 'status',
    });
  }

  if (search && typeof search === 'string') {
    const trimmed = search.trim();
    if (trimmed) {
      where.OR = [
        { email: { contains: trimmed, mode: 'insensitive' } },
        { fullName: { contains: trimmed, mode: 'insensitive' } },
      ];
    }
  }

  return where;
};

const buildStatusMetrics = (users) => {
  const counts = {
    ACTIVE: 0,
    PENDING_VERIFICATION: 0,
    SUSPENDED: 0,
    INVITED: 0,
  };

  let verified = 0;

  users.forEach((user) => {
    if (counts[user.status] !== undefined) {
      counts[user.status] += 1;
    }

    if (user.emailVerifiedAt) {
      verified += 1;
    }
  });

  return {
    totals: {
      all: users.length,
      active: counts.ACTIVE,
      pending: counts.PENDING_VERIFICATION,
      suspended: counts.SUSPENDED,
      invited: counts.INVITED,
      verified,
    },
    statusDistribution: Object.entries(counts).map(([status, value]) => ({
      status,
      value,
      label: status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/(^|\s)\w/g, (match) => match.toUpperCase()),
    })),
  };
};

const buildRegistrationTrend = (users) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const DAYS_TO_TRACK = 90;
  const buckets = [];
  const bucketMap = new Map();

  for (let i = DAYS_TO_TRACK - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);

    const key = date.toISOString().slice(0, 10);
    const entry = {
      key,
      date: key,
      label: date.toLocaleDateString('default', {
        month: 'short',
        day: 'numeric',
      }),
      year: date.getFullYear(),
      value: 0,
    };

    buckets.push(entry);
    bucketMap.set(key, entry);
  }

  users.forEach((user) => {
    if (!user.createdAt) {
      return;
    }

    const userDate = new Date(user.createdAt);
    userDate.setHours(0, 0, 0, 0);

    const key = userDate.toISOString().slice(0, 10);
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.value += 1;
    }
  });

  return buckets;
};

const getAdminUsers = async ({ search, status } = {}) => {
  const where = buildWhereClause({ search, status });

  const [users, roles] = await Promise.all([
    listUsers({ where }),
    listRoles(),
  ]);

  const enrichedUsers = await Promise.all(
    users.map(async (user) => ({
      ...user,
      avatarUrl: await resolveAvatarUrl(user),
    }))
  );

  const { totals, statusDistribution } = buildStatusMetrics(enrichedUsers);
  const monthlyRegistrations = buildRegistrationTrend(enrichedUsers);

  return {
    users: enrichedUsers.map(serializeUser),
    roles: roles.map(serializeRole),
    metrics: {
      totals,
      statusDistribution,
      monthlyRegistrations,
      lastRefreshedAt: new Date(),
    },
  };
};

const addField = (fields, value) => {
  if (!fields.includes(value)) {
    fields.push(value);
  }
};

const updateUserAccount = async ({ userId, updates = {}, actorId }) => {
  if (!userId || typeof userId !== 'string') {
    throw createValidationError('A valid user id is required for updates', {
      field: 'userId',
    });
  }

  if (!updates || typeof updates !== 'object') {
    throw createValidationError('Update payload must be an object', {
      field: 'updates',
    });
  }

  const payload = {};
  const fields = [];
  let cachedUser = null;
  let shouldAutoVerifyEmail = false;

  const ensureExistingUser = async () => {
    if (cachedUser) {
      return cachedUser;
    }

    cachedUser = await findUserById(userId);
    if (!cachedUser) {
      throw createNotFoundError('Requested user could not be found');
    }

    return cachedUser;
  };

  if (Object.prototype.hasOwnProperty.call(updates, 'fullName')) {
    const { fullName } = updates;
    if (fullName === null || fullName === undefined || fullName === '') {
      payload.fullName = null;
    } else if (typeof fullName === 'string') {
      payload.fullName = fullName.trim();
    } else {
      throw createValidationError('Full name must be a string or null', {
        field: 'fullName',
      });
    }

    addField(fields, 'fullName');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    const normalizedStatus = normalizeStatus(updates.status);
    if (!normalizedStatus) {
      throw createValidationError('Status must be one of the supported values', {
        field: 'status',
      });
    }
    payload.status = normalizedStatus;
    addField(fields, 'status');

    if (normalizedStatus === 'ACTIVE') {
      shouldAutoVerifyEmail = true;
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'email')) {
    const emailSchema = z
      .string({ required_error: 'Email is required' })
      .trim()
      .min(1, 'Email is required')
      .email('Email must be valid');

    let normalizedEmail;
    try {
      normalizedEmail = emailSchema.parse(updates.email).toLowerCase();
    } catch (error) {
      throw createValidationError('A valid email address is required', {
        field: 'email',
      });
    }

    payload.email = normalizedEmail;
    payload.emailVerifiedAt = null;
    addField(fields, 'email');
    addField(fields, 'emailVerifiedAt');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'verifyEmail')) {
    if (updates.verifyEmail !== true && updates.verifyEmail !== false) {
      throw createValidationError('verifyEmail must be a boolean', {
        field: 'verifyEmail',
      });
    }

    payload.emailVerifiedAt = updates.verifyEmail === true ? new Date() : null;
    addField(fields, 'emailVerifiedAt');
  }

  if (shouldAutoVerifyEmail) {
    payload.emailVerifiedAt = new Date();
    addField(fields, 'emailVerifiedAt');
  }

  let roleAssignmentsUpdate = null;

  if (Object.prototype.hasOwnProperty.call(updates, 'roleIds')) {
    if (!Array.isArray(updates.roleIds)) {
      throw createValidationError('Roles must be provided as an array', {
        field: 'roleIds',
      });
    }

    const invalidRoleId = updates.roleIds.find(
      (roleId) => typeof roleId !== 'string' || roleId.trim().length === 0
    );

    if (invalidRoleId !== undefined) {
      throw createValidationError('All role IDs must be non-empty strings', {
        field: 'roleIds',
      });
    }

    const normalizedRoleIds = Array.from(
      new Set(updates.roleIds.map((roleId) => roleId.trim()))
    );

    const existingUser = await ensureExistingUser();

    const currentRoleIds = new Set(
      (existingUser.roleAssignments ?? []).map((assignment) => assignment.roleId)
    );

    const rolesChanged =
      normalizedRoleIds.length !== currentRoleIds.size ||
      normalizedRoleIds.some((roleId) => !currentRoleIds.has(roleId));

    if (rolesChanged) {
      if (normalizedRoleIds.length > 0) {
        const matchedRoles = await findRolesByIds(normalizedRoleIds);
        if (matchedRoles.length !== normalizedRoleIds.length) {
          throw createValidationError('One or more provided roles are invalid', {
            field: 'roleIds',
          });
        }
      }

      const createAssignments = normalizedRoleIds.map((roleId) => ({
        role: {
          connect: { id: roleId },
        },
        assignedBy: actorId ?? null,
      }));

      roleAssignmentsUpdate = {
        deleteMany: {},
        ...(createAssignments.length > 0 ? { create: createAssignments } : {}),
      };

      addField(fields, 'roles');
    }
  }

  if (fields.length === 0 && !roleAssignmentsUpdate) {
    throw createValidationError('No valid fields provided for update');
  }

  const data = { ...payload };

  if (roleAssignmentsUpdate) {
    data.roleAssignments = roleAssignmentsUpdate;
  }

  let updatedUser;
  try {
    updatedUser = await updateUserById(userId, data);
  } catch (error) {
    if (error.code === 'P2025') {
      throw createNotFoundError('Requested user could not be found');
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      throw createValidationError('Email address is already in use', {
        field: 'email',
      });
    }
    throw error;
  }

  if (actorId) {
    await logAuthEvent({
      userId,
      eventType: 'admin.user.updated',
      payload: {
        actorId,
        fields,
      },
    });
  }

  logger.info('Admin updated user', { userId, actorId, fields });

  return serializeUser(updatedUser);
};

module.exports = {
  getAdminUsers,
  updateUserAccount,
};
