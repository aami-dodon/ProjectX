const { randomUUID } = require('crypto');
const { runWithRequestContext } = require('../utils/request-context-store');

const attachRequestIds = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  const traceId = req.headers['x-trace-id'] || randomUUID();

  const context = {
    requestId,
    traceId,
  };

  runWithRequestContext(context, () => {
    req.context = context;
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-trace-id', traceId);

    next();
  });
};

module.exports = {
  attachRequestIds,
};
