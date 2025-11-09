require('module-alias/register');

const { createApp } = require('@/app');
const { env } = require('@/config/env');
const { ensureDefaultAdmin } = require('@/modules/auth/seed-default-admin');
const { ensureEnforcer } = require('@/modules/auth/rbac-enforcer');
const { runDemoSeed } = require('@/modules/demo/demo.seed');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('server');
const app = createApp();
const serverStartTime = Date.now();

app.locals.serverStartTime = serverStartTime;

ensureDefaultAdmin().catch((error) => {
  logger.error('Failed to ensure default admin user', {
    error: error.message,
  });
});

ensureEnforcer().catch((error) => {
  logger.error('Failed to prime RBAC enforcer', {
    error: error.message,
  });
});

if (env.DEMO_FLAG) {
  runDemoSeed().catch((error) => {
    logger.error('Failed to seed demo data', {
      error: error.message,
    });
  });
} else {
  logger.info('Demo data seeding skipped (DEMO_FLAG disabled)');
}

const server = app.listen(env.SERVER_PORT, () => {
  logger.info('Server is listening', {
    port: env.SERVER_PORT,
    apiBasePath: '/api',
    environment: env.NODE_ENV,
  });
});

const gracefulShutdown = async (signal) => {
  logger.info('Received shutdown signal, closing server', { signal });
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
  app,
  server,
};
