const log = (level, message, { requestId, traceId, details } = {}) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (requestId) payload.requestId = requestId;
  if (traceId) payload.traceId = traceId;
  if (details !== undefined) payload.details = details;

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
};

const logger = {
  info: (message, context) => log('info', message, context),
  warn: (message, context) => log('warn', message, context),
  error: (message, context) => log('error', message, context),
};

module.exports = logger;
