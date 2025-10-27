const { getHealthStatus } = require('../services/health.service');
const { createLogger } = require('../../../utils/logger');

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

module.exports = {
  getHealth,
};
