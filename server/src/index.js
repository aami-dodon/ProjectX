require('module-alias/register');

const { createApp } = require('@/app');
const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('server');
const app = createApp();
const serverStartTime = Date.now();

app.locals.serverStartTime = serverStartTime;

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
