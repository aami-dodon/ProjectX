// src/integrations/prisma.js
const { PrismaClient } = require('@prisma/client');
const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('prisma');

// ✅ Initialize PrismaClient with explicit datasource URL (validated in env.js)
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

// ✅ Middleware: Log each Prisma query and duration
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

// ✅ Graceful disconnect helper
const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected successfully');
  } catch (error) {
    logger.error('Error during Prisma disconnection', { error: error.message });
  }
};

// ✅ Handle shutdown signals cleanly
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
