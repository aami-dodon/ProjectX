const path = require('path');
const logger = require('../utils/logger');

const {
  ApplicationError,
  buildErrorResponse,
} = require(path.resolve(__dirname, '../../..', 'shared', 'error-handling'));

const errorHandler = (err, req, res, next) => {
  const { requestId, traceId } = req.context ?? {};
  const isKnownError = err instanceof ApplicationError;
  const status = isKnownError ? err.status : 500;
  const error = isKnownError
    ? err
    : new ApplicationError('An unexpected error occurred', {
        status,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });

  logger.error(error.message, {
    requestId,
    traceId,
    details: {
      status,
      originalMessage: err.message,
    },
  });

  res.status(status).json(buildErrorResponse(error, { requestId, traceId }));
};

module.exports = errorHandler;
