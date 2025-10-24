const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { attachRequestIds } = require('./middleware/request-context');
const { requestLogger } = require('./middleware/request-logger');
const { errorHandler } = require('./middleware/error-handler');
const { env } = require('./config/env');
const healthRouter = require('./modules/health/health.router');
const emailRouter = require('./modules/email/email.router');
const storageRouter = require('./modules/storage/storage.router');

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ALLOWED_ORIGINS }));
  app.use(express.json({ limit: '2mb' }));
  app.use(attachRequestIds);
  app.use(requestLogger);

  const apiPrefix = env.API_PREFIX.replace(/\/+$/, '') || '/';

  app.use(`${apiPrefix}/health`, healthRouter);
  app.use(`${apiPrefix}/email`, emailRouter);
  app.use(`${apiPrefix}/storage`, storageRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: {
        message: 'Route not found',
        code: 'NOT_FOUND',
        details: null,
        requestId: req?.context?.requestId ?? null,
        traceId: req?.context?.traceId ?? null,
      },
    });
  });

  app.use(errorHandler);

  return app;
};

module.exports = {
  createApp,
};
