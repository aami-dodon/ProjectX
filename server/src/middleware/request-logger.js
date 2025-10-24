const pinoHttp = require('pino-http');
const { baseLogger } = require('../utils/logger');

const requestLogger = pinoHttp({
  logger: baseLogger,
  customLogLevel: (res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  customProps: (req, res) => ({
    requestId: req?.context?.requestId,
    traceId: req?.context?.traceId,
    path: req.url,
    method: req.method,
    statusCode: res.statusCode,
  }),
});

module.exports = {
  requestLogger,
};
