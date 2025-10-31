const { buildErrorResponse, ApplicationError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('error-handler');

const errorHandler = (err, req, res, _next) => {
  const requestId = null;
  const traceId = null;
  const status = err instanceof ApplicationError ? err.status : 500;

  const error = err instanceof ApplicationError ? err : new ApplicationError(err.message || 'Unexpected error');

  logger.error(err.message, {
    requestId,
    traceId,
    stack: err.stack,
    code: error.code,
    status,
  });

  res.status(status).json(buildErrorResponse(error, { requestId, traceId }));
};

module.exports = {
  errorHandler,
};
