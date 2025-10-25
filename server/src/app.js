const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { attachRequestIds } = require('./middleware/request-context');
const { requestLogger } = require('./middleware/request-logger');
const { errorHandler } = require('./middleware/error-handler');
const { env } = require('./config/env');
const { createLogger } = require('./utils/logger');
const { buildOpenApiSpec, swaggerUiOptions } = require('./config/swagger');

const logger = createLogger('app');
const emailRouter = require('./modules/email/email.router');
const storageRouter = require('./modules/storage/storage.router');
const swaggerSpec = buildOpenApiSpec();

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ALLOWED_ORIGINS }));
  app.use(express.json({ limit: '2mb' }));
  app.use(attachRequestIds);
  app.use(requestLogger);

  const apiPrefix = '/api';

  app.use(`${apiPrefix}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

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

  if (env.NODE_ENV !== 'production') {
    logger.debug({ environment: env.NODE_ENV }, 'Express application configured');
  }

  return app;
};

module.exports = {
  createApp,
};
