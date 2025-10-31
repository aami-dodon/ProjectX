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

  const writeAuditLog = async (client) => {
    await client.auditLog.create({
      data: {
        userId: context.userId ?? null,
        model: params.model,
        action,
        recordId,
        before: serializeForAudit(previous),
        after: params.action === 'delete' ? null : serializeForAudit(result),
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
