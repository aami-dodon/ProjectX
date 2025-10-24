const { createApp } = require('./app');
const { env } = require('./config/env');
const { createLogger } = require('./utils/logger');

const logger = createLogger('server');
const app = createApp();
const serverStartTime = Date.now();

app.locals.serverStartTime = serverStartTime;

const server = app.listen(env.SERVER_PORT, env.SERVER_HOST, () => {
  logger.info({ port: env.SERVER_PORT, host: env.SERVER_HOST }, 'Server is listening');
});

const gracefulShutdown = async (signal) => {
  logger.info({ signal }, 'Received shutdown signal, closing server');
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
