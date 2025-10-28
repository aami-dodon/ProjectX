const { performance } = require('perf_hooks');

const { prisma } = require('@/integrations/prisma');

const checkDatabaseConnection = async () => {
  const startedAt = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const latencyMs = Math.round(performance.now() - startedAt);
  return {
    status: 'operational',
    latencyMs,
  };
};

module.exports = {
  checkDatabaseConnection,
};
