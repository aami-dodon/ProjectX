const { AuditLogAction } = require('@prisma/client');
const { createValidationError } = require('@/utils/errors');
const {
  findRecentAuditLogs,
  countAuditLogs,
  findAuditUsersByIds,
  findAuditUserIdsBySearchTerm,
} = require('./audit.repository');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const normalizeLimit = (rawLimit) => {
  if (rawLimit === undefined || rawLimit === null) {
    return DEFAULT_LIMIT;
  }

  if (typeof rawLimit === 'string') {
    const trimmed = rawLimit.trim();
    if (!trimmed) {
      return DEFAULT_LIMIT;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      throw createValidationError('Limit must be an integer value', { field: 'limit' });
    }
    if (parsed < 1) {
      throw createValidationError('Limit must be greater than zero', { field: 'limit' });
    }
    if (parsed > MAX_LIMIT) {
      throw createValidationError(`Limit cannot exceed ${MAX_LIMIT}`, { field: 'limit' });
    }
    return parsed;
  }

  if (typeof rawLimit === 'number') {
    if (!Number.isInteger(rawLimit)) {
      throw createValidationError('Limit must be an integer value', { field: 'limit' });
    }
    if (rawLimit < 1) {
      throw createValidationError('Limit must be greater than zero', { field: 'limit' });
    }
    if (rawLimit > MAX_LIMIT) {
      throw createValidationError(`Limit cannot exceed ${MAX_LIMIT}`, { field: 'limit' });
    }
    return rawLimit;
  }

  throw createValidationError('Limit must be an integer value', { field: 'limit' });
};

const normalizeOffset = (rawOffset) => {
  if (rawOffset === undefined || rawOffset === null) {
    return 0;
  }

  if (typeof rawOffset === 'string') {
    const trimmed = rawOffset.trim();
    if (!trimmed) {
      return 0;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      throw createValidationError('Offset must be an integer value', { field: 'offset' });
    }
    if (parsed < 0) {
      throw createValidationError('Offset cannot be negative', { field: 'offset' });
    }
    return parsed;
  }

  if (typeof rawOffset === 'number') {
    if (!Number.isInteger(rawOffset)) {
      throw createValidationError('Offset must be an integer value', { field: 'offset' });
    }
    if (rawOffset < 0) {
      throw createValidationError('Offset cannot be negative', { field: 'offset' });
    }
    return rawOffset;
  }

  throw createValidationError('Offset must be an integer value', { field: 'offset' });
};

const normalizeModel = (rawModel) => {
  if (rawModel === undefined || rawModel === null) {
    return null;
  }

  if (typeof rawModel !== 'string') {
    return null;
  }

  const trimmed = rawModel.trim();
  return trimmed ? trimmed : null;
};

const VALID_AUDIT_ACTIONS = new Set(Object.values(AuditLogAction));

const normalizeAction = (rawAction) => {
  if (rawAction === undefined || rawAction === null) {
    return null;
  }

  const value = typeof rawAction === 'string' ? rawAction.trim().toUpperCase() : null;
  if (!value) {
    return null;
  }

  if (!VALID_AUDIT_ACTIONS.has(value)) {
    throw createValidationError('Action must be CREATE, UPDATE, or DELETE', { field: 'action' });
  }

  return value;
};

const normalizeSearchTerm = (rawSearch) => {
  if (rawSearch === undefined || rawSearch === null) {
    return null;
  }

  if (typeof rawSearch !== 'string') {
    return null;
  }

  const trimmed = rawSearch.trim();
  return trimmed ? trimmed : null;
};

const parseDate = (value, field) => {
  if (value === undefined || value === null) {
    return null;
  }

  const candidate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    throw createValidationError('Date must be a valid ISO 8601 value', { field });
  }

  return candidate;
};

const adjustEndOfDay = (date) => {
  if (!date) {
    return null;
  }

  const adjusted = new Date(date);

  if (
    adjusted.getHours() === 0 &&
    adjusted.getMinutes() === 0 &&
    adjusted.getSeconds() === 0 &&
    adjusted.getMilliseconds() === 0
  ) {
    adjusted.setHours(23, 59, 59, 999);
  }

  return adjusted;
};

const normalizeDateRange = ({ startDate, endDate } = {}) => {
  const normalizedStart = parseDate(startDate, 'startDate');
  const normalizedEnd = adjustEndOfDay(parseDate(endDate, 'endDate'));

  if (normalizedStart && normalizedEnd && normalizedEnd < normalizedStart) {
    throw createValidationError('End date must be on or after the start date', {
      field: 'endDate',
    });
  }

  return { startDate: normalizedStart, endDate: normalizedEnd };
};

const resolveSearchActions = (searchTerm) => {
  if (!searchTerm) {
    return [];
  }

  const normalized = searchTerm.toUpperCase();
  return Array.from(VALID_AUDIT_ACTIONS).filter((action) => action.includes(normalized));
};

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /(^|_)(id|uuid)$/i,
];

const SENSITIVE_KEYS = new Set([
  'passwordhash',
  'mfasecret',
  'apitoken',
  'refreshtoken',
  'accesstoken',
  'id',
  'recordid',
  'userid',
  'actorid',
  'targetid',
  'sessionid',
]);

const isSensitiveKey = (key) => {
  if (!key) {
    return false;
  }

  const normalized = key.toLowerCase();
  if (SENSITIVE_KEYS.has(normalized)) {
    return true;
  }

  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
};

const sanitizeSnapshot = (value) => {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  if (Array.isArray(value)) {
    const sanitizedArray = value
      .map((entry) => sanitizeSnapshot(entry))
      .filter((entry) => {
        if (entry === null || typeof entry === 'undefined') {
          return false;
        }
        if (typeof entry === 'object' && !Array.isArray(entry)) {
          return Object.keys(entry).length > 0;
        }
        if (Array.isArray(entry)) {
          return entry.length > 0;
        }
        return true;
      });

    return sanitizedArray.length > 0 ? sanitizedArray : null;
  }

  if (typeof value === 'object') {
    const sanitizedEntries = Object.entries(value)
      .filter(([key]) => !isSensitiveKey(key))
      .map(([key, entryValue]) => [key, sanitizeSnapshot(entryValue)])
      .filter(([, entryValue]) => {
        if (entryValue === null || typeof entryValue === 'undefined') {
          return false;
        }
        if (typeof entryValue === 'object' && !Array.isArray(entryValue)) {
          return Object.keys(entryValue).length > 0;
        }
        if (Array.isArray(entryValue)) {
          return entryValue.length > 0;
        }
        if (typeof entryValue === 'string') {
          return entryValue.trim().length > 0;
        }
        return true;
      });

    if (!sanitizedEntries.length) {
      return null;
    }

    return sanitizedEntries.reduce((accumulator, [key, entryValue]) => {
      accumulator[key] = entryValue;
      return accumulator;
    }, {});
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return value;
};

const formatChangeEntry = (change) => {
  if (!change) {
    return null;
  }

  if (typeof change === 'string') {
    const trimmed = change.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof change !== 'object') {
    return String(change);
  }

  const field =
    typeof change.field === 'string' && change.field.trim().length > 0
      ? change.field.trim()
      : 'Value';

  const previous =
    typeof change.previous === 'string'
      ? change.previous.trim() || '—'
      : change.previous ?? '—';

  const next =
    typeof change.next === 'string'
      ? change.next.trim() || '—'
      : change.next ?? '—';

  return `${field}: ${previous === null || previous === undefined ? '—' : previous} -> ${
    next === null || next === undefined ? '—' : next
  }`;
};

const sanitizeAuditLog = (log, userMap) => ({
  id: log.id,
  model: log.model,
  action: log.action,
  recordId: log.recordId,
  before: sanitizeSnapshot(log.before),
  after: sanitizeSnapshot(log.after),
  changes: Array.isArray(log.changes)
    ? log.changes.map((change) => formatChangeEntry(change)).filter(Boolean)
    : [],
  ip: log.ip,
  userAgent: log.userAgent,
  timestamp: log.timestamp,
  performedById: log.performedById,
  affectedUserId: log.affectedUserId,
  performedBy: log.performedById ? userMap.get(log.performedById) ?? null : null,
  affectedUser: log.affectedUserId ? userMap.get(log.affectedUserId) ?? null : null,
});

const listAuditLogs = async ({ limit, offset, model, action, search, startDate, endDate } = {}) => {
  const resolvedLimit = normalizeLimit(limit);
  const resolvedOffset = normalizeOffset(offset);
  const resolvedModel = normalizeModel(model);
  const resolvedAction = normalizeAction(action);
  const resolvedSearch = normalizeSearchTerm(search);
  const { startDate: normalizedStartDate, endDate: normalizedEndDate } = normalizeDateRange({
    startDate,
    endDate,
  });

  const searchUserIds = resolvedSearch
    ? Array.from(new Set(await findAuditUserIdsBySearchTerm(resolvedSearch)))
    : [];

  const searchActions = resolveSearchActions(resolvedSearch);

  const [logs, total] = await Promise.all([
    findRecentAuditLogs({
      limit: resolvedLimit,
      offset: resolvedOffset,
      model: resolvedModel,
      action: resolvedAction,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      searchTerm: resolvedSearch,
      searchActions,
      searchUserIds,
    }),
    countAuditLogs({
      model: resolvedModel,
      action: resolvedAction,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      searchTerm: resolvedSearch,
      searchActions,
      searchUserIds,
    }),
  ]);

  const userIds = Array.from(
    new Set(
      logs
        .flatMap((log) => [log.performedById, log.affectedUserId])
        .filter((userId) => typeof userId === 'string' && userId.trim().length > 0)
    )
  );
  const users = await findAuditUsersByIds(userIds);
  const userMap = new Map(
    users.map((user) => [user.id, { id: user.id, email: user.email, fullName: user.fullName }])
  );

  return {
    logs: logs.map((log) => sanitizeAuditLog(log, userMap)),
    total,
    limit: resolvedLimit,
    offset: resolvedOffset,
  };
};

module.exports = {
  listAuditLogs,
};
