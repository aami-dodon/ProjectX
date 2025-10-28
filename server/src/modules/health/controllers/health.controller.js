const {
  getHealthStatus,
  createHealthUploadPresign,
  sendHealthTestEmail,
} = require('../services/health.service');
const { createLogger } = require('../../../utils/logger');
const { createIntegrationError, createValidationError } = require('../../../utils/error-handling');

const logger = createLogger('health-controller');

const getHealth = async (req, res, next) => {
  try {
    const requestId = req?.context?.requestId ?? null;
    const traceId = req?.context?.traceId ?? null;
    const serverStartTime = req.app.locals.serverStartTime ?? Date.now();
    const corsOptions = req.app.locals.corsOptions ?? {};

    const health = await getHealthStatus({ serverStartTime, corsOptions });

    res.json({
      status: health.status,
      timestamp: new Date().toISOString(),
      requestId,
      traceId,
      data: {
        system: health.system,
        api: health.api,
        cors: health.cors,
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to retrieve health status');
    next(error);
  }
};

const requestStoragePresign = async (req, res, next) => {
  const { contentType } = req.body ?? {};

  if (!contentType || typeof contentType !== 'string') {
    return next(createValidationError('Image content type is required'));
  }

  if (!contentType.toLowerCase().startsWith('image/')) {
    return next(createValidationError('Only image uploads are supported'));
  }

  try {
    const payload = await createHealthUploadPresign({ contentType });

    return res.json(payload);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create MinIO presigned upload URL');
    return next(createIntegrationError('Failed to create MinIO presigned upload URL', { cause: error.message }));
  }
};

const sendTestEmailFromHealth = async (req, res, next) => {
  const { to } = req.body ?? {};

  if (!to || typeof to !== 'string') {
    return next(createValidationError('Recipient email is required'));
  }

  try {
    const info = await sendHealthTestEmail({ to });

    return res.json({
      status: 'sent',
      messageId: info?.messageId ?? null,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to send health test email');
    return next(createIntegrationError('Failed to send test email', { cause: error.message }));
  }
};

module.exports = {
  getHealth,
  requestStoragePresign,
  sendTestEmailFromHealth,
};
