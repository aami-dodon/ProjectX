const pino = require('pino');

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'res.headers'],
});

const createLogger = (name) => baseLogger.child({ module: name });

module.exports = {
  baseLogger,
  createLogger,
};
