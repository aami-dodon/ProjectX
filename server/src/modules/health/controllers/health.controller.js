const { getHealthStatus } = require('@/modules/health/services/health.service');
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
    logger.error({ error: error.message }, 'Failed to retrieve health status');
    next(error);
  }
};

module.exports = {
  getHealth,
};
