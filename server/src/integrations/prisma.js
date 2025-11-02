// src/integrations/prisma.js
const { PrismaClient, AuditLogAction } = require('@prisma/client');
const { env } = require('@/config/env');
const { getAuditContext } = require('@/utils/audit-context-store');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('prisma');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log:
    env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
});

const WRITE_ACTIONS = new Set(['create', 'update', 'delete']);
const ROUTINE_DATE_FIELDS = new Set([
  'lastloginat',
  'lastlogindate',
  'lastaccessedat',
  'lastaccessedtime',
  'lastaccessedon',
  'updatedat',
]);

const getDelegate = (model) => {
  if (!model) {
    return null;
  }

  const delegateName = model.charAt(0).toLowerCase() + model.slice(1);
  return prisma[delegateName] ?? null;
};

const serializeForAudit = (payload) => {
  if (payload === undefined) {
    return null;
  }

  try {
    return JSON.parse(
      JSON.stringify(payload, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  } catch (error) {
    logger.warn('Failed to serialize audit payload', {
      error: error.message,
    });
    return null;
  }
};

const resolveRecordId = (source, args) => {
  if (source && source.id !== undefined && source.id !== null) {
    return String(source.id);
  }

  const where = args?.where;
  if (!where || typeof where !== 'object') {
    return null;
  }

  const entries = Object.entries(where);
  if (entries.length === 0) {
    return null;
  }

  const [, value] = entries[0];

  if (value && typeof value === 'object') {
    if ('equals' in value) {
      const equalsValue = value.equals;
      if (equalsValue !== undefined && equalsValue !== null) {
        return String(equalsValue);
      }
    }

    if ('in' in value && Array.isArray(value.in) && value.in.length === 1) {
      const first = value.in[0];
      if (first !== undefined && first !== null) {
        return String(first);
      }
    }

    return null;
  }

  if (value !== undefined && value !== null) {
    return String(value);
  }

  return null;
};

const formatChangeValue = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '—';
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    return value
      .map((entry) => formatChangeValue(entry))
      .filter((entry) => entry && entry !== '—')
      .join(', ');
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      logger.warn('Failed to stringify change value', {
        error: error.message,
      });
    }
  }

  return String(value);
};

const snapshotToEntries = (snapshot) => {
  if (snapshot === null || snapshot === undefined) {
    return [];
  }

  if (Array.isArray(snapshot) || typeof snapshot !== 'object') {
    return [
      {
        field: 'value',
        value: snapshot,
      },
    ];
  }

  return Object.entries(snapshot).map(([field, value]) => ({
    field,
    value,
  }));
};

const buildChangeEntries = (beforeSnapshot, afterSnapshot) => {
  const beforeEntries = snapshotToEntries(beforeSnapshot);
  const afterEntries = snapshotToEntries(afterSnapshot);

  const beforeMap = new Map(beforeEntries.map((entry) => [entry.field, entry.value]));
  const afterMap = new Map(afterEntries.map((entry) => [entry.field, entry.value]));

  const keys = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  return Array.from(keys).reduce((changes, key) => {
    const normalizedKey = key?.toString().trim();
    if (!normalizedKey) {
      return changes;
    }

    const lowerKey = normalizedKey.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (ROUTINE_DATE_FIELDS.has(lowerKey)) {
      return changes;
    }

    const previous = beforeMap.get(key);
    const next = afterMap.get(key);

    const serializedPrevious = JSON.stringify(previous);
    const serializedNext = JSON.stringify(next);

    if (serializedPrevious === serializedNext) {
      return changes;
    }

    changes.push({
      field: normalizedKey === 'value' ? 'Value' : normalizedKey,
      previous: formatChangeValue(previous),
      next: formatChangeValue(next),
    });

    return changes;
  }, []);
};

const resolveAffectedUserId = ({
  context,
  model,
  recordId,
  beforeSnapshot,
  afterSnapshot,
}) => {
  if (context?.affectedUserId) {
    return context.affectedUserId;
  }

  if (model === 'AuthUser') {
    if (recordId) {
      return recordId;
    }

    const source =
      (afterSnapshot && typeof afterSnapshot === 'object' && afterSnapshot.id) ||
      (beforeSnapshot && typeof beforeSnapshot === 'object' && beforeSnapshot.id);

    if (source) {
      return String(source);
    }
  }

  return null;
};

prisma.$use(async (params, next) => {
  if (!params.model || params.model === 'AuditLog' || !WRITE_ACTIONS.has(params.action)) {
    return next(params);
  }

  const delegate = getDelegate(params.model);
  let previous = null;

  if ((params.action === 'update' || params.action === 'delete') && delegate && params.args?.where) {
    try {
      previous = await delegate.findUnique({ where: params.args.where });
    } catch (error) {
      logger.warn('Failed to resolve previous record for audit logging', {
        model: params.model,
        action: params.action,
        error: error.message,
      });
    }
  }

  const result = await next(params);

  const context = getAuditContext() ?? {};
  const action =
    params.action === 'create'
      ? AuditLogAction.CREATE
      : params.action === 'update'
        ? AuditLogAction.UPDATE
        : params.action === 'delete'
          ? AuditLogAction.DELETE
          : null;

  if (!action) {
    return result;
  }

  const recordId =
    resolveRecordId(result, params.args) ??
    resolveRecordId(previous, params.args);

  const serializedBefore = serializeForAudit(previous);
  const serializedAfter = params.action === 'delete' ? null : serializeForAudit(result);
  const changes = buildChangeEntries(serializedBefore, serializedAfter);
  const affectedUserId = resolveAffectedUserId({
    context,
    model: params.model,
    recordId,
    beforeSnapshot: serializedBefore,
    afterSnapshot: serializedAfter,
  });

  const writeAuditLog = async (client) => {
    await client.auditLog.create({
      data: {
        performedById: context.userId ?? null,
        affectedUserId,
        model: params.model,
        action,
        recordId,
        before: serializedBefore,
        after: serializedAfter,
        changes: changes.length > 0 ? changes : null,
        ip: context.ip ?? null,
        userAgent: context.userAgent ?? null,
      },
    });
  };

  try {
    if (typeof params.runInTransaction === 'function') {
      await params.runInTransaction((transactionClient) => writeAuditLog(transactionClient));
    } else {
      await writeAuditLog(prisma);
    }
  } catch (error) {
    logger.error('Failed to write audit log entry', {
      model: params.model,
      action: params.action,
      error: error.message,
    });
  }

  return result;
});

prisma.$use(async (params, next) => {
  const startedAt = Date.now();

  try {
    const result = await next(params);
    const elapsed = Date.now() - startedAt;

    if (env.NODE_ENV === 'development') {
      logger.debug('Prisma query executed', {
        model: params.model,
        action: params.action,
        elapsedMs: elapsed,
      });
    }

    return result;
  } catch (error) {
    logger.error('Prisma query failed', {
      model: params.model,
      action: params.action,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
});

const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected successfully');
  } catch (error) {
    logger.error('Error during Prisma disconnection', { error: error.message });
  }
};

process.on('beforeExit', async () => {
  await disconnectPrisma();
});

process.on('SIGINT', async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
});

module.exports = {
  prisma,
  disconnectPrisma,
};
