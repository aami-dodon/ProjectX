const { PrismaClient } = require('@prisma/client');
const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('prisma');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

prisma.$use(async (params, next) => {
  const startedAt = Date.now();
  try {
    const result = await next(params);
    const elapsed = Date.now() - startedAt;
    logger.debug('Prisma query executed', { action: params.action, model: params.model, elapsed });
    return result;
  } catch (error) {
    logger.error('Prisma query failed', { error: error.message, params });
    throw error;
  }
});

module.exports = {
  prisma,
};
