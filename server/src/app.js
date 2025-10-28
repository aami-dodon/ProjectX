require('module-alias/register');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const redoc = require('redoc-express');
const { requestLogger } = require('@/middleware/request-logger');
const { errorHandler } = require('@/middleware/error-handler');
const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');
const { setupSwaggerDocs } = require('@/config/swagger');

const logger = createLogger('app');
const healthRouter = require('@/modules/health/health.router');
const createApp = () => {
  const app = express();

  app.use(helmet());
  const corsOptions = {
    origin: env.CORS_ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
  };

  app.use(cors(corsOptions));
  app.locals.corsOptions = corsOptions;
  app.use(express.json({ limit: '2mb' }));
  app.use(requestLogger);

  setupSwaggerDocs(app);
  app.get(
    '/docs',
    redoc({
      title: 'Project-X Docs',
      specUrl: '/api/docs.json',
      nonce: '',
    })
  );

  const apiPrefix = '/api';

  app.use(`${apiPrefix}/health`, healthRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: {
        message: 'Route not found',
        code: 'NOT_FOUND',
        details: null,
        requestId: null,
        traceId: null,
      },
    });
  });

  app.use(errorHandler);

  if (env.NODE_ENV !== 'production') {
    logger.debug({ environment: env.NODE_ENV }, 'Express application configured');
  }

  return app;
};

module.exports = {
  createApp,
};
