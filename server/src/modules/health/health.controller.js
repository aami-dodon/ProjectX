const logger = require('../../utils/logger');
const { getHealthStatus } = require('./health.service');

const getHealth = async (req, res, next) => {
  try {
    const data = await getHealthStatus();
    logger.info('Health check evaluated', {
      requestId: req.context?.requestId,
      traceId: req.context?.traceId,
      details: data,
    });

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
};
