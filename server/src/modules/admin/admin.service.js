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
  countUsers,
  countUsersByStatus,
  listUserRegistrationsSince,
} = require('./admin.repository');

const logger = createLogger('admin-service');

const VALID_STATUSES = new Set([
  'PENDING_VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
  'INVITED',
]);

const STATUS_KEYS = ['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'INVITED'];

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

const parseFilterParam = (rawFilter) => {
  if (!rawFilter) {
    return {};
  }

  const values = Array.isArray(rawFilter)
    ? rawFilter
    : `${rawFilter}`
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

  return values.reduce((acc, entry) => {
    const [rawKey, ...valueParts] = entry.split(':');
    if (!rawKey || valueParts.length === 0) {
      return acc;
    }

    const key = rawKey.trim().toLowerCase();
    const value = valueParts.join(':').trim();
    if (!value) {
      return acc;
    }

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(value);
    return acc;
  }, {});
};

const buildWhereClause = ({ search, status, filters }) => {
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

  const roleFilters = filters?.role ?? filters?.roles;
  if (Array.isArray(roleFilters) && roleFilters.length > 0) {
    const roleConditions = roleFilters.flatMap((value) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }

      return [
        { id: trimmed },
        { name: { equals: trimmed, mode: 'insensitive' } },
      ];
    });

    if (roleConditions.length > 0) {
      where.roleAssignments = {
        some: {
          role: {
            OR: roleConditions,
          },
        },
      };
    }
  }

  return where;
};

const buildStatusMetrics = ({ statusCounts = {}, verifiedCount = 0, totalCount = 0 }) => {
  const resolvedCounts = STATUS_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: statusCounts[key] ?? 0,
    }),
    {}
  );

  const totals = {
    all: typeof totalCount === 'number' ? totalCount : 0,
    active: resolvedCounts.ACTIVE,
    pending: resolvedCounts.PENDING_VERIFICATION,
    suspended: resolvedCounts.SUSPENDED,
    invited: resolvedCounts.INVITED,
    verified: verifiedCount ?? 0,
  };

  return {
    totals,
    statusDistribution: Object.entries(resolvedCounts).map(([status, value]) => ({
      status,
      value,
      label: status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/(^|\s)\w/g, (match) => match.toUpperCase()),
    })),
  };
};

const buildRegistrationTrend = (registrations) => {
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

  (registrations ?? []).forEach((entry) => {
    const createdAt = entry?.createdAt ?? entry;
    if (!createdAt) {
      return;
    }

    const userDate = new Date(createdAt);
    userDate.setHours(0, 0, 0, 0);

    const key = userDate.toISOString().slice(0, 10);
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.value += 1;
    }
  });

  return buckets;
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

const normalizePagination = ({ limit, offset, page, pageSize } = {}) => {
  if (page !== undefined || pageSize !== undefined) {
    const parsedPageSize = pageSize !== undefined ? Number(pageSize) : DEFAULT_LIMIT;
    if (!Number.isInteger(parsedPageSize) || parsedPageSize <= 0) {
      throw createValidationError('pageSize must be a positive integer', {
        field: 'pageSize',
      });
    }

    const boundedPageSize = Math.min(parsedPageSize, MAX_LIMIT);

    const parsedPage = page !== undefined ? Number(page) : 1;
    if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
      throw createValidationError('page must be a positive integer', {
        field: 'page',
      });
    }

    const offsetFromPage = (parsedPage - 1) * boundedPageSize;

    return {
      limit: boundedPageSize,
      offset: offsetFromPage,
      page: parsedPage,
      pageSize: boundedPageSize,
    };
  }

  let resolvedLimit = DEFAULT_LIMIT;
  if (limit !== undefined) {
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw createValidationError('limit must be a positive integer', {
        field: 'limit',
      });
    }
    resolvedLimit = Math.min(parsed, MAX_LIMIT);
  }

  let resolvedOffset = 0;
  if (offset !== undefined) {
    const parsed = Number(offset);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw createValidationError('offset must be a non-negative integer', {
        field: 'offset',
      });
    }
    resolvedOffset = parsed;
  }

  const inferredPage = Math.floor(resolvedOffset / resolvedLimit) + 1;

  return {
    limit: resolvedLimit,
    offset: resolvedOffset,
    page: inferredPage,
    pageSize: resolvedLimit,
  };
};

const SORTABLE_FIELD_MAP = {
  name: 'fullName',
  fullName: 'fullName',
  email: 'email',
  status: 'status',
  createdAt: 'createdAt',
  lastLoginAt: 'lastLoginAt',
  lastLogin: 'lastLoginAt',
};

const normalizeSort = (sortInput) => {
  if (!sortInput) {
    return [{ createdAt: 'desc' }];
  }

  const entries = Array.isArray(sortInput)
    ? sortInput
    : `${sortInput}`
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

  const orderBy = entries
    .map((entry) => {
      const [rawField, rawDirection] = entry.split(':');
      const normalizedField = rawField?.trim();
      const field = SORTABLE_FIELD_MAP[normalizedField] ?? SORTABLE_FIELD_MAP[entry.trim()];
      if (!field) {
        return null;
      }

      const direction = rawDirection?.trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
      return { [field]: direction };
    })
    .filter(Boolean);

  if (orderBy.length === 0) {
    return [{ createdAt: 'desc' }];
  }

  return orderBy;
};

const getAdminUsers = async ({
  search,
  status,
  limit,
  offset,
  page,
  pageSize,
  sort,
  filter,
} = {}) => {
  const filters = parseFilterParam(filter);
  const where = buildWhereClause({ search, status, filters });
  const pagination = normalizePagination({ limit, offset, page, pageSize });
  const orderBy = normalizeSort(sort);

  const [users, roles, totalMatching] = await Promise.all([
    listUsers({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      orderBy,
    }),
    listRoles(),
    countUsers({ where }),
  ]);

  const enrichedUsers = await Promise.all(
    users.map(async (user) => ({
      ...user,
      avatarUrl: await resolveAvatarUrl(user),
    }))
  );

  const [globalTotal, statusCounts, verifiedCount, recentRegistrations] = await Promise.all([
    countUsers(),
    countUsersByStatus(),
    countUsers({
      where: {
        emailVerifiedAt: { not: null },
      },
    }),
    listUserRegistrationsSince({
      since: (() => {
        const since = new Date();
        since.setDate(since.getDate() - 89);
        since.setHours(0, 0, 0, 0);
        return since;
      })(),
    }),
  ]);

  const { totals, statusDistribution } = buildStatusMetrics({
    statusCounts,
    verifiedCount,
    totalCount: globalTotal,
  });
  const monthlyRegistrations = buildRegistrationTrend(recentRegistrations);

  return {
    users: enrichedUsers.map(serializeUser),
    roles: roles.map(serializeRole),
    metrics: {
      totals,
      statusDistribution,
      monthlyRegistrations,
      lastRefreshedAt: new Date(),
    },
    pagination: {
      total: totalMatching,
      limit: pagination.limit,
      offset: pagination.offset,
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
    totalCount: totalMatching,
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
    } catch {
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

    if (rolesChanged && actorId && actorId === existingUser.id) {
      throw createValidationError('Administrators cannot modify their own roles', {
        field: 'roleIds',
      });
    }

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
    try {
      await logAuthEvent({
        userId,
        eventType: 'admin.user.updated',
        payload: {
          actorId,
          fields,
        },
      });
    } catch (error) {
      logger.warn('Failed to record admin audit log for user update', {
        userId,
        actorId,
        fields,
        error: error.message,
      });
    }
  }

  logger.info('Admin updated user', { userId, actorId, fields });

  return serializeUser(updatedUser);
};

module.exports = {
  getAdminUsers,
  updateUserAccount,
};
