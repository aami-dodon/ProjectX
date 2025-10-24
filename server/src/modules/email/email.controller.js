const logger = require('../../utils/logger');
const { requestTestEmail } = require('./email.service');

const sendTestEmailHandler = async (req, res, next) => {
  try {
    const result = await requestTestEmail({
      to: req.body?.to,
      metadata: {
        requestedBy: req.body?.requestedBy ?? 'unknown',
        requestTime: new Date().toISOString(),
      },
    });

    logger.info('Test email dispatched', {
      requestId: req.context?.requestId,
      traceId: req.context?.traceId,
      details: result,
    });

    res.status(202).json({ data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendTestEmailHandler,
};
