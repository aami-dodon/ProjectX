const crypto = require('crypto');
const logger = require('../utils/logger');

const requestContext = (req, res, next) => {
  const incomingRequestId = req.headers['x-request-id'];
  const requestId = incomingRequestId || crypto.randomUUID();
  const traceId = req.headers['x-trace-id'] || requestId;

  req.context = { requestId, traceId };
  res.locals.context = req.context;

  res.setHeader('x-request-id', requestId);
  res.setHeader('x-trace-id', traceId);

  logger.info('Incoming request', {
    requestId,
    traceId,
    details: {
      method: req.method,
      path: req.originalUrl,
    },
  });

  res.on('finish', () => {
    logger.info('Request completed', {
      requestId,
      traceId,
      details: {
        status: res.statusCode,
      },
    });
  });

  next();
};

module.exports = requestContext;
