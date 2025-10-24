const { PrismaClient } = require('@prisma/client');
const { env } = require('../config/env');
const { createLogger } = require('../utils/logger');

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
    logger.debug({ action: params.action, model: params.model, elapsed }, 'Prisma query executed');
    return result;
  } catch (error) {
    logger.error({ error: error.message, params }, 'Prisma query failed');
    throw error;
  }
});

module.exports = {
  prisma,
};
