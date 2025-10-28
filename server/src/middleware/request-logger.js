const morgan = require('morgan');
const { createLogger } = require('../utils/logger');

const httpLogger = createLogger('http');

const requestLogger = morgan(
  (tokens, req, res) => {
    const status = Number(tokens.status(req, res)) || 0;
    const responseTime = tokens['response-time'](req, res);
    const contentLength = tokens.res(req, res, 'content-length');
    const parsedContentLength = Number.parseInt(contentLength, 10);

    const logPayload = {
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      statusCode: status,
      responseTimeMs: responseTime ? Number.parseFloat(responseTime) : undefined,
      contentLength: Number.isNaN(parsedContentLength) ? undefined : parsedContentLength,
      remoteAddress: tokens['remote-addr'](req, res),
      userAgent: tokens['user-agent'](req, res),
    };

    return JSON.stringify(logPayload);
  },
  {
    stream: {
      write: (message) => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
          return;
        }

        let payload;
        try {
          payload = JSON.parse(trimmedMessage);
        } catch (error) {
          httpLogger.warn({ error: error.message, raw: trimmedMessage }, 'Unable to parse HTTP log entry');
          return;
        }

        const { statusCode, ...metadata } = payload;

        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

        httpLogger[level](
          {
            statusCode,
            ...metadata,
          },
          'HTTP request completed'
        );
      },
    },
  }
);

module.exports = {
  requestLogger,
};

