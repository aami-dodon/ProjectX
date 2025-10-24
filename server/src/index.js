const { spawnSync } = require('child_process');
const app = require('./app');
const config = require('./config');
const prisma = require('./integrations/prisma');
const logger = require('./utils/logger');

const ensureOpenSSLAvailable = () => {
  const result = spawnSync('openssl', ['version']);
  if (result.error || result.status !== 0) {
    const errorMessage = result.error?.message || result.stderr.toString();
    logger.error('OpenSSL is required for Prisma but was not found on the system', {
      details: errorMessage,
    });
    throw new Error(errorMessage);
  }

  logger.info(`OpenSSL available: ${result.stdout.toString().trim()}`);
};

const start = async () => {
  try {
    ensureOpenSSLAvailable();
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');

    const server = app.listen(config.server.port, () => {
      logger.info(`Server listening on ${config.server.port}`, {
        details: { env: process.env.NODE_ENV ?? 'development' },
      });
      app.emit('ready');
    });

    const shutdown = async () => {
      logger.info('Shutting down server');
      await prisma.$disconnect().catch((error) => {
        logger.error('Error while disconnecting Prisma', { details: error.message });
      });
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', { details: error.message });
    process.exit(1);
  }
};

start();
