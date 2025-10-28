const { getHealthStatus } = require('@/modules/health/health.service');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('health-controller');

const getHealth = async (req, res, next) => {
  try {
    const serverStartTime = req.app.locals.serverStartTime ?? Date.now();
    const corsOptions = req.app.locals.corsOptions ?? {};

    const health = await getHealthStatus({ serverStartTime, corsOptions });

    res.json({
      status: health.status,
      timestamp: new Date().toISOString(),
      requestId: null,
      traceId: null,
      data: {
        system: health.system,
        api: health.api,
        cors: health.cors,
      },
    });
  } catch (error) {
    logger.error('Failed to retrieve health status', { error: error.message });
    next(error);
  }
};

module.exports = {
  getHealth,
};
