const {
  createNotFoundError,
  createValidationError,
} = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
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

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  avatarObjectName: user.avatarObjectName ?? null,
  tenantId: user.tenantId,
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
        { tenantId: { contains: trimmed, mode: 'insensitive' } },
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
  const buckets = [];

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({
      key,
      label: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      value: 0,
    });
  }

  users.forEach((user) => {
    if (!user.createdAt) {
      return;
    }

    const userDate = new Date(user.createdAt);
    const key = `${userDate.getFullYear()}-${String(userDate.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.find((entry) => entry.key === key);
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

  const { totals, statusDistribution } = buildStatusMetrics(users);
  const monthlyRegistrations = buildRegistrationTrend(users);

  return {
    users: users.map(serializeUser),
    roles: roles.map(serializeRole),
    metrics: {
      totals,
      statusDistribution,
      monthlyRegistrations,
      lastRefreshedAt: new Date(),
    },
  };
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

    fields.push('fullName');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'tenantId')) {
    const { tenantId } = updates;
    if (tenantId === null || tenantId === undefined || tenantId === '') {
      payload.tenantId = null;
    } else if (typeof tenantId === 'string') {
      payload.tenantId = tenantId.trim();
    } else {
      throw createValidationError('Tenant ID must be a string or null', {
        field: 'tenantId',
      });
    }

    fields.push('tenantId');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    const normalizedStatus = normalizeStatus(updates.status);
    if (!normalizedStatus) {
      throw createValidationError('Status must be one of the supported values', {
        field: 'status',
      });
    }
    payload.status = normalizedStatus;
    fields.push('status');
  }

  let roleAssignmentsUpdate = null;

  if (Object.prototype.hasOwnProperty.call(updates, 'roleIds')) {
    if (!Array.isArray(updates.roleIds)) {
      throw createValidationError('Roles must be provided as an array', {
        field: 'roleIds',
      });
    }

    const normalizedRoleIds = Array.from(
      new Set(
        updates.roleIds
          .filter((roleId) => typeof roleId === 'string')
          .map((roleId) => roleId.trim())
          .filter((roleId) => roleId.length > 0)
      )
    );

    const existingUser = await findUserById(userId);
    if (!existingUser) {
      throw createNotFoundError('Requested user could not be found');
    }

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

      fields.push('roles');
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
