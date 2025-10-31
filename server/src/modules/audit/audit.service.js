const { createValidationError } = require('@/utils/errors');
const { findRecentAuditLogs } = require('./audit.repository');

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

const listAuditLogs = async ({ limit } = {}) => {
  const resolvedLimit = normalizeLimit(limit);
  const logs = await findRecentAuditLogs(resolvedLimit);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      model: log.model,
      action: log.action,
      recordId: log.recordId,
      before: log.before,
      after: log.after,
      ip: log.ip,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    })),
  };
};

module.exports = {
  listAuditLogs,
};
