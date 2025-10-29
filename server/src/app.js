require('module-alias/register');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { requestLogger } = require('@/middleware/request-logger');
const { errorHandler } = require('@/middleware/error-handler');
const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');
const { setupSwaggerDocs } = require('@/config/swagger');

const logger = createLogger('app');
const healthRouter = require('@/modules/health/health.router');
const emailRouter = require('@/modules/email/email.router');
const uploadRouter = require('@/modules/upload/upload.router');
const authRouter = require('@/modules/auth/auth.router');
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

  const docsAssetsPath = path.join(__dirname, '..', 'public', 'docs');
  const redocBasePath = '/api/redocs';
  app.use(`${redocBasePath}/assets`, express.static(docsAssetsPath, { maxAge: '1d' }));
  app.get([redocBasePath, `${redocBasePath}/`], (req, res) => {
    res.sendFile(path.join(docsAssetsPath, 'index.html'));
  });

  const apiPrefix = '/api';

  app.use(`${apiPrefix}/health`, healthRouter);
  app.use(`${apiPrefix}/auth`, authRouter);
  app.use(`${apiPrefix}/email`, emailRouter);
  app.use(`${apiPrefix}/upload`, uploadRouter);

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
    logger.debug('Express application configured', { environment: env.NODE_ENV });
  }

  return app;
};

module.exports = {
  createApp,
};
