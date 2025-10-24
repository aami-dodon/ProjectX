const DEFAULT_ERROR_CODE = 'INTERNAL_SERVER_ERROR';

class ApplicationError extends Error {
  constructor(message, { status = 500, code = DEFAULT_ERROR_CODE, details = null } = {}) {
    super(message);
    this.name = 'ApplicationError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, ApplicationError);
  }
}

const createNotFoundError = (message = 'Resource not found', details = null) =>
  new ApplicationError(message, { status: 404, code: 'NOT_FOUND', details });

const createValidationError = (message = 'Request validation failed', details = null) =>
  new ApplicationError(message, { status: 400, code: 'VALIDATION_ERROR', details });

const createIntegrationError = (message = 'Upstream integration failed', details = null) =>
  new ApplicationError(message, { status: 502, code: 'INTEGRATION_ERROR', details });

const createUnauthorizedError = (message = 'Unauthorized', details = null) =>
  new ApplicationError(message, { status: 401, code: 'UNAUTHORIZED', details });

const buildErrorResponse = (error, { requestId, traceId } = {}) => ({
  error: {
    message: error.message,
    code: error.code ?? DEFAULT_ERROR_CODE,
    details: error.details ?? null,
    requestId: requestId ?? null,
    traceId: traceId ?? null,
  },
});

module.exports = {
  ApplicationError,
  buildErrorResponse,
  createIntegrationError,
  createNotFoundError,
  createUnauthorizedError,
  createValidationError,
};
